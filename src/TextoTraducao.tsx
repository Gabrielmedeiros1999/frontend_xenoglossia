import { useState, useEffect, useRef  } from "react";
import { useTheme } from "./context/ThemeContext";
import { ModalIdiomas } from "./components/ModalIdiomas";
import { Link } from "react-router-dom"
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";

const API_URL = import.meta.env.VITE_API_URL;

export default function TextoTraducao() {
  const { darkMode } = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino} = useIdioma();
  const [tipoSelecao, setTipoSelecao] = useState<"origem" | "destino">("origem");
  const [textoOrigem, setTextoOrigem] = useState("");
  const [textoTraduzido, setTextoTraduzido] = useState("");
  const [carregando, setCarregando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
    setIdiomaOrigem(idioma);
  } else {
    setIdiomaDestino(idioma);
  }
}
  
 function falarTexto(texto: string, idioma: string) {
  if (!texto) return;

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = idioma;
  utterance.volume = 1;    
  utterance.rate = 1;      
  utterance.pitch = 1;     

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

 async function traduzir() {
  if (!textoOrigem.trim()) return;
  setCarregando(true);
 
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
   
  abortRef.current?.abort();

  const controller = new AbortController();
  abortRef.current = controller;

  try {
    const res = await fetch(`${API_URL}/traduzir`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        texto: textoOrigem,
        origem: idiomaOrigem.codigo,
        destino: idiomaDestino.codigo,
        modo: "texto",
      }),
    });

    const data = await res.json();
  

    if (!res.ok) {
      setTextoTraduzido(`Erro: ${data.detail}`);
      return;
    }

    setTextoTraduzido(data.traducao);
    registrarIdioma(idiomaOrigem.nome);  
    registrarIdioma(idiomaDestino.nome); 
  } catch (e) {
    setTextoTraduzido("Erro ao traduzir. Tente novamente.");
  } finally {
     setCarregando(false);
  }
}

useEffect(() => {
  if (!textoOrigem.trim()) {
    setTextoTraduzido("");
    return;
  }

  const delay = setTimeout(() => {
    traduzir();
  }, 800); 

  return () => clearTimeout(delay);
}, [textoOrigem]);

  const placeholder = darkMode ? "placeholder:text-cyan-500" : "placeholder:text-gray-500";

  return (
    <div className={`flex flex-col min-h-screen px-4 ${darkMode ? "bg-[#0F172A]" : "bg-gray-50"}`}>
     <div className="flex flex-col gap-4 mt-4">
      {/* Seleção de idiomas */}
      <div className="flex gap-3 justify-center mb-4">
        <button
          onClick={() => abrirModal("origem")}
          className={`h-8 w-25 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
        >
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

      {/* Área de texto origem */}
      <div className={`relative rounded-xl border ${darkMode ? "border-white" : "border-black"} mb-1`}>
        <textarea
          value={textoOrigem}
          onChange={(e) => setTextoOrigem(e.target.value)}
          placeholder={`Seu texto em ${idiomaOrigem.nome}`}
          rows={6}
          className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholder}`}
        />

        {/* Ícone de voz */}
        {textoOrigem && (
         <button
           onClick={() => falarTexto(textoOrigem, idiomaOrigem.codigo)}
           className="absolute top-2 right-2"
           >
          <img
           src={darkMode ? "/Voice Recognition-dark.png" : "/Voice Recognition.png"}
           alt="ouvir"
           className="w-8 h-8 cursor-pointer"
          />
         </button>
        )}
      </div>

      {/* Divisor */}
       <div className="w-full flex items-center gap-2 mb-6">
        <div className="flex-1 h-px bg-gray-400" />
        <img src={darkMode ? "/fluent_translate-auto-24-filled-dark.png" : "/fluent_translate-auto-24-filled.png"} />
        <div className="flex-1 h-px bg-gray-400" />
      </div>

      {/* Área de texto traduzido */}
      <div className={`relative rounded-xl border  ${darkMode ? "bg-zinc-700 border-white" : "bg-zinc-200 border-black"} mb-6`}>
        <textarea
          value={textoTraduzido}
          readOnly
          placeholder={
             carregando
              ? "Traduzindo..."
              : `Seu texto em ${idiomaDestino.nome}`
              }
          rows={6}
          className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholder}`}
        />
        {textoTraduzido && (
          <button
           onClick={() => falarTexto(textoTraduzido, idiomaDestino.codigo)}
           className="absolute top-2 right-2"
            >
          <img
           src={darkMode ? "/Voice Recognition-dark.png" : "/Voice Recognition.png"}
           alt="ouvir"
           className="w-8 h-8 cursor-pointer"
          />
         </button>
        )}
      </div>

      {/* Ícones de navegação */}
      <div className="flex justify-center gap-6 mt-auto">
        <img src={darkMode ? "/Component 3-select-dark.png" : "/Component 3-select.png"} className="h-10" />
        <Link to='/imgTraducao'><img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" /></Link>
        <Link to='/vozTraducao'><img src={darkMode ? "/Component 1-dark.png" : "/Component 1.png"} className="h-10" /></Link>
      </div>
      </div>
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