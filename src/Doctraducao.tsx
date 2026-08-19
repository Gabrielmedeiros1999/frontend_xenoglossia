import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import { ModalIdiomas } from "./components/ModalIdiomas";
import { Link } from "react-router-dom"
import { useRef } from "react";
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";
import { useProgressoSimulado } from "./hooks/useProgressoSimulado";
import { apiFetch, SessaoExpiradaError } from "./utils/apiFetch";

const EXTENSOES_ACEITAS = [".pdf", ".txt", ".docx"];
const TIPOS_ACEITOS = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function DocTraducao() {
  const { darkMode } = useTheme();

  const { progresso, iniciar, concluir, cancelar } = useProgressoSimulado();

  const [openModal, setOpenModal] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino } = useIdioma();
  const [tipoSelecao, setTipoSelecao] = useState<"origem" | "destino">("origem");

  const [documento, setDocumento] = useState<File | null>(null);
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [falando, setFalando] = useState<"resultado" | null>(null);
  const [sentimento, setSentimento] = useState<"positivo" | "negativo" | "neutro" | null>(null);
  const [analisandoSentimento, setAnalisandoSentimento] = useState(false);

  const inputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/idiomas_pt.json")
      .then(res => res.json())
      .then(data => setIdiomas(data))
      .catch(() => console.error("Erro ao carregar idiomas"));
  }, []);

  async function abrirModal(tipo: "origem" | "destino") {
    setTipoSelecao(tipo);
    setOpenModal(true);
  }

  function handleSelecionar(nome: string, codigo: string) {
    const idioma = { nome, codigo };

    if (tipoSelecao === "origem") {
      if (codigo === idiomaDestino.codigo) {
        setIdiomaDestino(idiomaOrigem);
      }
      setIdiomaOrigem(idioma);
    } else {
      if (codigo === idiomaOrigem.codigo) {
        setIdiomaOrigem(idiomaDestino);
      }
      setIdiomaDestino(idioma);
    }
  }

  function extensaoValida(file: File) {
    const nome = file.name.toLowerCase();
    const extensaoOk = EXTENSOES_ACEITAS.some(ext => nome.endsWith(ext));
    const tipoOk = !file.type || TIPOS_ACEITOS.includes(file.type);
    return extensaoOk && tipoOk;
  }

  function handleDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!extensaoValida(file)) {
      setResultado("Erro: envie um arquivo PDF, TXT ou DOCX");
      return;
    }

    setDocumento(file);
    setResultado("");
    setSentimento(null);
    enviarDocumentoDireto(file);
  }

  async function analisarSentimento(texto: string) {
    if (!texto.trim()) {
      setSentimento(null);
      return;
    }

    setAnalisandoSentimento(true);

    try {
      const res = await apiFetch("/analisar-sentimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSentimento(null);
        return;
      }

      if (data.sentimento === "positivo" || data.sentimento === "negativo" || data.sentimento === "neutro") {
        setSentimento(data.sentimento);
      } else {
        setSentimento(null);
      }
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        return;
      }
      setSentimento(null);
    } finally {
      setAnalisandoSentimento(false);
    }
  }

  async function enviarDocumentoDireto(file: File) {
    setCarregando(true);
    iniciar();
    setSentimento(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("origem", idiomaOrigem.codigo);
    formData.append("destino", idiomaDestino.codigo);
    formData.append("formato_saida", "texto");

    try {
      const res = await apiFetch("/traduzir-documento", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResultado(`Erro: ${data.detail}`);
        cancelar();
        return;
      }

      setResultado(data.traducao);
      concluir();
      registrarIdioma(idiomaOrigem.nome);
      registrarIdioma(idiomaDestino.nome);
      analisarSentimento(data.traducao);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        cancelar();
        return;
      }
      setResultado("Erro ao enviar documento");
      cancelar();
    } finally {
      setCarregando(false);
    }
  }

  async function baixarDocumentoTraduzido(formato: "pdf" | "docx") {
    if (!documento) return;

    setBaixando(true);

    const formData = new FormData();
    formData.append("file", documento);
    formData.append("origem", idiomaOrigem.codigo);
    formData.append("destino", idiomaDestino.codigo);
    formData.append("formato_saida", formato);

    try {
      const res = await apiFetch("/traduzir-documento", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setResultado(`Erro: ${data?.detail ?? "não foi possível gerar o arquivo"}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento_traduzido.${formato}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        return;
      }
      setResultado("Erro ao gerar documento traduzido");
    } finally {
      setBaixando(false);
    }
  }

  function falarTexto(texto: string, idioma: string, campo: "resultado") {
    if (!texto) return;

    // Clicou de novo enquanto fala: para a fala
    if (falando === campo) {
      speechSynthesis.cancel();
      setFalando(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = idioma;
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setFalando(campo);
    utterance.onend = () => setFalando(null);
    utterance.onerror = () => setFalando(null);

    speechSynthesis.cancel();

    const falar = () => {
      const vozes = speechSynthesis.getVoices();
      const vozIdioma = vozes.find(v => v.lang.startsWith(idioma));
      if (vozIdioma) utterance.voice = vozIdioma;
      speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.getVoices().length > 0) {
      falar();
    } else {
      speechSynthesis.addEventListener("voiceschanged", falar, { once: true });
    }
  }

  const placeholder = darkMode ? "placeholder:text-cyan-500" : "placeholder:text-gray-500";

  return (
    <div className={`flex flex-col min-h-screen px-4 ${darkMode ? "bg-[#0F172A]" : "bg-gray-50"}`}>
      <div className="flex flex-col gap-4 mt-4">
        {/* Idiomas */}
        <div className="flex gap-3 justify-center mb-4">
          <button onClick={() => abrirModal("origem")} className={`h-8 w-25 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
            {idiomaOrigem.nome}
          </button>

          <img src={darkMode ? "/typcn_arrow-up-outline-dark.png" : "/typcn_arrow-up-outline.png"} alt="seta" />

          <button
            onClick={() => abrirModal("destino")}
            className={`h-8 w-25 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
          >
            {idiomaDestino.nome}
          </button>
        </div>

        {/* Área de upload */}
        <div className={`flex flex-col items-center gap-3 rounded-xl px-4 py-5`}>
          {/* Input de arquivo */}
          <label className="w-full cursor-pointer">
            <div className={`flex items-center gap-2 rounded-md border text-sm ${darkMode ? "border-white text-white" : "border-black text-black"}`}>
              <span className={`text-xs font-medium w-auto pl-2 pr-1 pb-2 pt-2 rounded border border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
                Escolher Arquivo
              </span>
              <span className="truncate text-xs">
                {documento ? documento.name : "Nenhum arquivo selecionado"}
              </span>
            </div>
            <input
              ref={inputFileRef}
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleDocumento}
              className="hidden"
            />
          </label>

          <span className={`text-xs text-center ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
            Envie um arquivo PDF, TXT ou DOCX para traduzir
          </span>

          {/* Card do documento selecionado */}
          {documento && (
            <div className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${darkMode ? "border-white/40 bg-zinc-800" : "border-black/20 bg-white"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
                  {documento.name.split(".").pop()?.toUpperCase()}
                </span>
                <span className={`truncate text-xs ${darkMode ? "text-white" : "text-black"}`}>
                  {documento.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setDocumento(null);
                  setResultado("");
                  setSentimento(null);
                  if (inputFileRef.current) {
                    inputFileRef.current.value = "";
                  }
                }}
                className="shrink-0 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
              >✕</button>
            </div>
          )}
        </div>

        {/* Área de texto traduzido */}
        <div className={`relative rounded-xl border ${darkMode ? "bg-zinc-700 border-white" : "bg-zinc-200 border-black"} mb-2`}>
          {!carregando && !analisandoSentimento && sentimento && (
            <div className="flex justify-start px-4 pt-3">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  sentimento === "positivo"
                    ? "bg-green-500/20 text-green-600"
                    : sentimento === "negativo"
                    ? "bg-red-500/20 text-red-600"
                    : "bg-gray-500/20 text-gray-600"
                }`}
                title={
                  sentimento === "positivo"
                    ? "Sentimento positivo"
                    : sentimento === "negativo"
                    ? "Sentimento negativo"
                    : "Sentimento neutro"
                }
              >
                {sentimento === "positivo" ? "😊 Positivo" : sentimento === "negativo" ? "😡 Negativo" : "😐 Neutro"}
              </span>
            </div>
          )}

          <textarea
            value={resultado}
            readOnly
            placeholder={
              carregando
                ? `Traduzindo... ${progresso}%`
                : `Tradução do documento em ${idiomaDestino.nome}`
            }
            rows={8}
            className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholder}`}
          />

          {carregando && (
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10">
              <div className="h-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${progresso}%` }} />
            </div>
          )}

          {resultado && !carregando && (
            <button
              onClick={() => falarTexto(resultado, idiomaDestino.codigo, "resultado")}
              className="absolute top-2 right-2"
              aria-label={falando === "resultado" ? "Parar leitura" : "Ouvir texto"}
            >
              <img
                src={darkMode ? "/Voice Recognition-dark.png" : "/Voice Recognition.png"}
                alt="ouvir"
                className={`w-8 h-8 cursor-pointer transition-transform ${
                  falando === "resultado" ? "scale-110 animate-pulse" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* Baixar documento traduzido */}
        {resultado && !carregando && documento && (
          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={() => baixarDocumentoTraduzido("pdf")}
              disabled={baixando}
              className={`h-8 px-4 rounded-md text-sm border cursor-pointer border-black disabled:opacity-50 ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
            >
              {baixando ? "Gerando..." : "Baixar PDF traduzido"}
            </button>
            <button
              onClick={() => baixarDocumentoTraduzido("docx")}
              disabled={baixando}
              className={`h-8 px-4 rounded-md text-sm border cursor-pointer border-black disabled:opacity-50 ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
            >
              {baixando ? "Gerando..." : "Baixar DOCX traduzido"}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-auto">
          <Link to='/textoTraducao'><img src={darkMode ? "/Component 3-dark.png" : "/Component 3.png"} className="h-10" /></Link>
          <Link to='/imgTraducao'><img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" /></Link>
          <Link to='/vozTraducao'><img src={darkMode ? "/Component 1-dark.png" : "/Component 1.png"} className="h-10" /></Link>
          <img src={darkMode ? "/Component 19-select-dark.png" : "/Component 19-select.png"} className="h-10" />
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <ModalIdiomas
          idiomas={idiomas}
          tipoSelecao={tipoSelecao}
          onSelecionar={handleSelecionar}
          onFechar={() => setOpenModal(false)}
        />
      )}
    </div>
  );
}