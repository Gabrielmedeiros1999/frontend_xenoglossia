import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import { ModalIdiomas } from "./components/ModalIdiomas";
import { Link } from "react-router-dom"
import { useRef } from "react";
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";
import { useProgressoSimulado } from "./hooks/useProgressoSimulado";
import { apiFetch, SessaoExpiradaError } from "./utils/apiFetch";


export default function ImgTraducao() {
  const { darkMode } = useTheme();

  const { progresso, iniciar, concluir, cancelar } = useProgressoSimulado();

  const [openModal, setOpenModal] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino} = useIdioma();
  const [tipoSelecao, setTipoSelecao] = useState<"origem" | "destino">("origem");

  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [falando, setFalando] = useState<"resultado" | null>(null);
  const [sentimento, setSentimento] = useState<"positivo" | "negativo" | "neutro" | null>(null);
  const [analisandoSentimento, setAnalisandoSentimento] = useState(false);
  
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    if(codigo === idiomaDestino.codigo) {
      setIdiomaDestino(idiomaOrigem);
    }
    setIdiomaOrigem(idioma);
  } else {
    if(codigo === idiomaOrigem.codigo){
      setIdiomaOrigem(idiomaDestino);
    }
    setIdiomaDestino(idioma);
  }
}

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagem(file);
    setPreview(URL.createObjectURL(file));
    setResultado("");
    setSentimento(null);
    enviarImagemDireto(file);
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

async function enviarImagemDireto(file: File) {
  setCarregando(true);
  iniciar();
  setSentimento(null);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("origem", idiomaOrigem.codigo);
  formData.append("destino", idiomaDestino.codigo);

  try {
    const res = await apiFetch("/traduzir-imagem", {
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
    setResultado("Erro ao enviar imagem");
    cancelar();
  } finally {
    setCarregando(false);
  }
}

async function abrirCamera() {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    setStream(mediaStream);
    setCameraAtiva(true);

    // 👇 espera o componente renderizar
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }, 100);

  } catch (err) {
    console.error(err);
    alert("Erro ao acessar câmera");
  }
}

function tirarFoto() {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;

    const file = new File([blob], "foto.jpg", { type: "image/jpeg" });

    setImagem(file);
    setPreview(URL.createObjectURL(blob));
    setResultado("");
    setSentimento(null);

    enviarImagemDireto(file);
  }, "image/jpeg");

  fecharCamera();
}

function fecharCamera() {
  stream?.getTracks().forEach(track => track.stop());
  setCameraAtiva(false);
  setStream(null);
}

useEffect(() => {
  return () => {
    if (preview) URL.revokeObjectURL(preview);
  };
}, [preview]);

useEffect(() => {
  return () => {
    stream?.getTracks().forEach(track => track.stop());
  };
}, [stream]);

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
        <div className={`flex flex-col items-center gap-3 rounded-xl  px-4 py-5`}>
          {/* Input de arquivo */}
          <label className="w-full cursor-pointer">
            <div className={`flex items-center gap-2 rounded-md border text-sm ${darkMode ? "border-white text-white" : "border-black  text-black"}`}>
              <span className={`text-xs font-medium w-auto pl-2 pr-1 pb-2  pt-2 rounded border border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
                Escolher Arquivo
              </span>
              <span className="truncate text-xs">
                {imagem ? imagem.name : "Nenhum arquivo selecionado"}
              </span>
            </div>
            <input ref={inputFileRef} type="file" accept="image/*" onChange={handleImagem} className="hidden" />
          </label>

          {/* Separador OU */}
          {!preview && (
            <>
              <p className={`text-sm font-semibold ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>OU</p>

              {/* Botão câmera */}
             <button onClick={abrirCamera}>
              <img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" />
              </button>
              <span className={`text-xs text-center ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
                  Tire uma foto do que deseja traduzir
                </span>
            </>
          )}

          {/* Preview da imagem */}
          {preview && (
            <div className="w-full relative">
              <img src={preview} alt="preview" className="w-full max-h-48 object-contain rounded-lg" />
              <button
                onClick={() => { 
                  setImagem(null); 
                  setPreview(null); 
                  setResultado("");
                  setSentimento(null);
                  if (inputFileRef.current) {
                   inputFileRef.current.value = "";
                  }
                 }}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
              >✕</button>
            </div>
          )}
        </div>

         {/* Área de texto traduzido */}
      <div className={`relative rounded-xl border  ${darkMode ? "bg-zinc-700 border-white" : "bg-zinc-200 border-black"} mb-6`}>
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
              : `Tradução do texto da imagem em ${idiomaDestino.nome}`
              }
          rows={6}
          className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholder}`}
        />

        {carregando && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10">
           <div className="h-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${progresso}%` }} />
          </div>   
        )}

        {resultado && (
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

       <div className="flex justify-center gap-6 mt-auto">
        <Link to='/textoTraducao'><img src={darkMode ? "/Component 3-dark.png" : "/Component 3.png"} className="h-10" /></Link>
        <img src={darkMode ? "/Component 2-select-dark.png" : "/Component 2-select.png"} className="h-10" />
        <Link to='/vozTraducao'><img src={darkMode ? "/Component 1-dark.png" : "/Component 1.png"} className="h-10" /></Link>
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

      {cameraAtiva && (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 h-dvh overflow-hidden">

    <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
      />
    </div>

    <canvas ref={canvasRef} className="hidden" />

    <div className="shrink-0 flex gap-4 my-4">
      <button
        onClick={tirarFoto}
        className="bg-green-500 px-4 py-2 rounded text-black"
      >
        Tirar Foto
      </button>

      <button
        onClick={fecharCamera}
        className="bg-red-500 px-4 py-2 rounded text-white"
      >
        Cancelar
      </button>
    </div>
  </div>
)}
    </div>
  );
}