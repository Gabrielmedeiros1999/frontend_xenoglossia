import { useState, useRef, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import { ModalIdiomas } from "./components/ModalIdiomas";
import { Link } from "react-router-dom";
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";

const API_URL = import.meta.env.VITE_API_URL;

interface MensagemConversa {
  pessoa: 1 | 2;
  texto: string;
  traducao: string;
}

export default function VozTraducao() {
  const { darkMode } = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino } = useIdioma();
  const [tipoSelecao, setTipoSelecao] = useState<"origem" | "destino">("origem");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);

  // Modo conversação
  const [modoConversa, setModoConversa] = useState(false);
  const [conversa, setConversa] = useState<MensagemConversa[]>([]);
  const [turnoAtual, setTurnoAtual] = useState<1 | 2>(1);
  const conversaRef = useRef<HTMLDivElement>(null);
  const [contadorInicio, setContadorInicio] = useState<number | null>(null);
  const [mostrarInfoConversa, setMostrarInfoConversa] = useState(false); 

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const turnoRef = useRef<1 | 2>(1);
  const silenceTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    fetch("/idiomas_pt.json")
      .then(res => res.json())
      .then(data => setIdiomas(data))
      .catch(() => console.error("Erro ao carregar idiomas"));
  }, []);

  // Scroll automático na conversa
  useEffect(() => {
    if (conversaRef.current) {
      conversaRef.current.scrollTop = conversaRef.current.scrollHeight;
    }
  }, [conversa]);

  // Mantém o ref sincronizado com o estado
  useEffect(() => {
    turnoRef.current = turnoAtual;
  }, [turnoAtual]);

  async function abrirModal(tipo: "origem" | "destino") {
    setTipoSelecao(tipo);
    setOpenModal(true);
  }

  function handleSelecionar(nome: string, codigo: string) {
    const idioma = { nome, codigo };
    if (tipoSelecao === "origem") setIdiomaOrigem(idioma);
    else setIdiomaDestino(idioma);
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
    if (speechSynthesis.getVoices().length > 0) falar();
    else speechSynthesis.addEventListener("voiceschanged", falar, { once: true });
  }

  // ── Gravação normal ──────────────────────────────────────────────────────────

  async function iniciarGravacao() {
    if (gravando) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
          
        console.log("chunk recebido:", e.data.size);

        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await enviarAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setGravando(true);
    } catch (err) {
      console.error(err);
      setGravando(false);
    }
  }

  function pararGravacao() {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
      setGravando(false);
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setGravando(false);
  }

  async function enviarAudio(audioBlob: Blob) {
    setCarregando(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("origem", idiomaOrigem.codigo);
      formData.append("destino", idiomaDestino.codigo);
        
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/traduzir-voz`, { 
        method: "POST", 
        headers: {
          ...(token && {
            Authorization: `Bearer ${token}`,
             }),
             },
        body: formData
       });

      const data = await res.json();

      if (!res.ok) { setResultado(`Erro: ${data.detail}`); return; }

      setResultado(data.traducao);
      registrarIdioma(idiomaOrigem.nome);
      registrarIdioma(idiomaDestino.nome);
    } catch {
      setResultado("Erro ao conectar com o servidor");
    } finally {
      setCarregando(false);
    }
  }

  // ── Modo Conversação ─────────────────────────────────────────────────────────

  async function iniciarGravacaoConversa() {

    console.log("INICIOU GRAVACAO CONVERSA");

    chunksRef.current = [];

if (silenceTimeoutRef.current) {
  clearTimeout(silenceTimeoutRef.current);
  silenceTimeoutRef.current = null;
}

    if (!modoConversaRef.current) return;
    
    try {
      console.log("PEDINDO MICROFONE");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("MICROFONE OK");
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

mediaRecorder.ondataavailable = (e) => {
  if (e.data && e.data.size > 0) {
    chunksRef.current.push(e.data);
  }
};

      mediaRecorder.onstop = async () => {

        console.log("ONSTOP EXECUTOU");
        console.log("chunks:", chunksRef.current.length);

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        if (!modoConversaRef.current) return;

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processarTurno(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setGravando(true);
      
const audioContext = new AudioContext();

const source = audioContext.createMediaStreamSource(stream);

const analyser = audioContext.createAnalyser();

source.connect(analyser);

analyser.fftSize = 2048;

const dataArray = new Uint8Array(analyser.fftSize);

let gravacaoFinalizada = false;
let pessoaComecouFalar = false;

const LIMITE_VOLUME = 0.02;


// quantidade de loops silenciosos necessários
const MAX_SILENCIO = 30;

// contador
let silencioAtual = 0;

let detectorAtivo = true;

const detectarSilencio = () => {
  if (!modoConversaRef.current || gravacaoFinalizada) return;

  analyser.getByteTimeDomainData(dataArray);

  let soma = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const valor = (dataArray[i] - 128) / 128;
    soma += valor * valor;
  }

  const volume = Math.sqrt(soma / dataArray.length);

  console.log({
  volume,
  pessoaComecouFalar,
  silencioAtual
});

  console.log("volume:", volume);

  // detectou fala
  if (volume > LIMITE_VOLUME) {
    pessoaComecouFalar = true;

    // reseta silêncio
    silencioAtual = 0;
  }

  // começou a falar e agora ficou silencioso
  else if (pessoaComecouFalar) {
    silencioAtual++;

    console.log("silencio:", silencioAtual);

    // ~3 segundos de silêncio
    if (silencioAtual >= MAX_SILENCIO) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        gravacaoFinalizada = true;
         
        detectorAtivo = false;

        console.log("CHAMANDO STOP");

        mediaRecorderRef.current.stop();

        setGravando(false);

        return;
      }
    }
  }
  
  if (detectorAtivo) {
  setTimeout(detectarSilencio, 100);
  }
};



detectarSilencio();
     
    } catch (err) {
      console.error(err);
    }
  }

async function processarTurno(audioBlob: Blob) {
  if (!modoConversaRef.current) return; // ← verificação no início

  setCarregando(true);
  const turno = turnoRef.current;
  const origemTurno = turno === 1 ? idiomaOrigem.codigo : idiomaDestino.codigo;
  const destinoTurno = turno === 1 ? idiomaDestino.codigo : idiomaOrigem.codigo;

  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("origem", origemTurno);
    formData.append("destino", destinoTurno);

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/traduzir-voz`, {
       method: "POST", 
       headers: {
        ...(token && {
          Authorization: `Bearer ${token}`,
          }),
          },
       body: formData 
      });
    const data = await res.json();

    if (!res.ok) return;
    if (!modoConversaRef.current) return; // ← verifica após o fetch

    const novaMensagem: MensagemConversa = {
      pessoa: turno,
      texto: data.texto_transcrito || "",
      traducao: data.traducao,
    };

    setConversa(prev => [...prev, novaMensagem]);

    // Alterna o turno
    const proximoTurno: 1 | 2 = turno === 1 ? 2 : 1;
    setTurnoAtual(proximoTurno);
    turnoRef.current = proximoTurno;

    // Controle para evitar iniciar dois turnos
    let proximoTurnoIniciado = false;

    const iniciarProximoTurno = () => {
      if (modoConversaRef.current && !proximoTurnoIniciado) {
        proximoTurnoIniciado = true;
        iniciarGravacaoConversa();
      }
    };

    // Fala a tradução
    const utterance = new SpeechSynthesisUtterance(data.traducao);
    utterance.lang = destinoTurno;
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = iniciarProximoTurno;

    speechSynthesis.cancel();

    const falar = () => {
      const vozes = speechSynthesis.getVoices();
      const vozIdioma = vozes.find(v => v.lang.startsWith(destinoTurno));
      if (vozIdioma) utterance.voice = vozIdioma;
      speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.getVoices().length > 0) falar();
    else speechSynthesis.addEventListener("voiceschanged", falar, { once: true });

    // Fallback caso onend não dispare
    const fallbackTimeout = setTimeout(() => {
  iniciarProximoTurno();
}, 1500);

utterance.onend = () => {
  clearTimeout(fallbackTimeout);
  iniciarProximoTurno();
};

  } catch {
    console.error("Erro no turno de conversação");
  } finally {
    setCarregando(false);
  }
}

  const modoConversaRef = useRef(false);

function toggleModoConversa() {
  if (modoConversa) {
    // Desativa o ref PRIMEIRO — impede qualquer callback de continuar
    modoConversaRef.current = false;

    // Cancela a fala imediatamente
    speechSynthesis.cancel();

    // Para o stream do microfone diretamente (mais confiável que parar o MediaRecorder)
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    // Para o MediaRecorder com segurança
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.ondataavailable = null; // ← ignora dados pendentes
        mediaRecorderRef.current.onstop = null;         // ← ignora o onstop
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
    }

if (silenceTimeoutRef.current) {
  clearTimeout(silenceTimeoutRef.current);
}

    mediaRecorderRef.current = null;

    // Reseta estados
    setModoConversa(false);
    setGravando(false);
    setCarregando(false);
    setTurnoAtual(1);
    turnoRef.current = 1;

  } else {
  modoConversaRef.current = true;

  setModoConversa(true);
  setConversa([]);

  setTurnoAtual(1);
  turnoRef.current = 1;

  let tempo = 5;

  setContadorInicio(tempo);

  const intervalo = setInterval(() => {
    tempo--;

    if (tempo > 0) {
      setContadorInicio(tempo);
    } else {
      clearInterval(intervalo);

      setContadorInicio(null);

      if (modoConversaRef.current) {
        iniciarGravacaoConversa();
      }
    }
  }, 1000);
}
}

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      modoConversaRef.current = false;
    };
  }, []);

  const placeholder = darkMode ? "placeholder:text-cyan-500" : "placeholder:text-gray-500";

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? "bg-[#0F172A] text-white" : "bg-gray-50 text-gray-800"}`}>
      <div className="flex flex-col gap-0 mt-1">

        {/* Idiomas */}
        <div className="flex gap-3 justify-center mt-4 mb-4">
          <button
            onClick={() => abrirModal("origem")}
            className={`h-8 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
          >
            {idiomaOrigem.nome}
          </button>
          <img src={darkMode ? "/typcn_arrow-up-outline-dark.png" : "/typcn_arrow-up-outline.png"} alt="seta" />
          <button
            onClick={() => abrirModal("destino")}
            className={`h-8 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
          >
            {idiomaDestino.nome}
          </button>
        </div>
        
       

        {/* Modo normal */}
        {!modoConversa && (  
          <>
            <div className="flex justify-center mt-4 px-4">
              <div className={`relative rounded-xl border flex flex-col justify-between w-full max-w-md h-56 ${darkMode ? "bg-zinc-700 border-white text-cyan-500" : "bg-zinc-200 border-black"} mb-6`}>
                <textarea
                  value={carregando ? "Traduzindo..." : resultado}
                  readOnly
                  placeholder="Fala da pessoa convertido para texto"
                  rows={6}
                  className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholder}`}
                />
                {resultado && !carregando && (
                  <button onClick={() => falarTexto(resultado, idiomaDestino.codigo)} className="absolute top-2 right-2">
                    <img src={darkMode ? "/Voice Recognition-dark.png" : "/Voice Recognition.png"} alt="ouvir" className="w-8 h-8 cursor-pointer" />
                  </button>
                )}
              </div>
            </div>
            
          </>
        )}

        {/* Modo conversação */}
        {modoConversa && (
          <div className="flex flex-col items-center px-4 gap-3">

            {/* Indicador de turno */}
            <div className={`text-sm font-semibold px-4 py-1 rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
              {contadorInicio !== null
                  ? `A tradução vai começar em ${contadorInicio}s...`
                  : gravando
                  ? `🎙️ Pessoa ${turnoAtual} falando (${turnoAtual === 1 ? idiomaOrigem.nome : idiomaDestino.nome})`
                  : carregando
                  ? `Traduzindo...`
                  : `Aguardando Pessoa ${turnoAtual}...`
              }
            </div>

            {/* Lista de mensagens */}
            <div
              ref={conversaRef}
              className={`w-full max-w-md h-80 overflow-y-auto rounded-xl border p-3 flex flex-col gap-2 ${darkMode ? "bg-zinc-800 border-zinc-600" : "bg-white border-gray-300"}`}
            >
              {conversa.length === 0 && (
                <p className={`text-sm text-center mt-8 ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
                  A conversa aparecerá aqui...
                </p>
              )}
              {conversa.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.pessoa === 1 ? "items-start" : "items-end"}`}>
                  <span className={`text-xs mb-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                    Pessoa {msg.pessoa} — {msg.pessoa === 1 ? idiomaOrigem.nome : idiomaDestino.nome}
                  </span>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    msg.pessoa === 1
                      ? darkMode ? "bg-green-600 text-white" : "bg-blue-500 text-white"
                      : darkMode ? "bg-zinc-600 text-white" : "bg-gray-200 text-gray-800"
                  }`}>
                    <p className="text-xs opacity-70 mb-1">{msg.texto}</p>
                    <p className="font-medium">{msg.traducao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                     {/* Toggle Modo Conversação */}
        <div className="flex justify-center items-center gap-2 mt-4 text-sm">
           <div className="relative">
  <img
    src={
      darkMode
        ? "/material-symbols_info-outline-dark.png"
        : "/material-symbols_info-outline.png"
    }
    alt="Informação"
    className="cursor-pointer w-5 h-5"
    
    // Desktop
    onMouseEnter={() => setMostrarInfoConversa(true)}
    onMouseLeave={() => setMostrarInfoConversa(false)}

    // Mobile
    onClick={() =>
      setMostrarInfoConversa((prev) => !prev)
    }
  />

  {mostrarInfoConversa && (
    <div
      className={`
        absolute z-50 top-7 left-1/2 -translate-x-1/2
        w-45 p-3 rounded-xl text-xs shadow-lg
        ${darkMode
          ? "bg-zinc-800 text-white border border-zinc-600"
          : "bg-white text-gray-800 border border-gray-300"}
      `}
    >
      O modo conversação permite tradução de voz em tempo real entre duas
      pessoas.

      <br /><br />

      A Pessoa 1 fala no idioma de origem e a fala é traduzida para o idioma
      de destino.

      <br /><br />

      Depois, a Pessoa 2 fala no idioma de destino e a fala é traduzida para o
      idioma de origem automaticamente.
    </div>
  )}
</div>
          <span className="font-bold">Modo Conversação</span>
          <button
            onClick={toggleModoConversa}
            disabled={carregando}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${modoConversa ? darkMode ? "bg-[#7C3AED]" : "bg-[#7C3AED]" : "bg-gray-400"}`}
          >
            <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 ${darkMode ? "bg-black" : "bg-white"} ${modoConversa ?  "left-6" : "left-0.5"}`} />
          </button>
        </div>

        {/* Botão de gravação */}
        {!modoConversa && (  
            <div className="flex flex-col items-center justify-center py-15 select-none">
              <button
                onClick={() => { if (gravando) pararGravacao(); else iniciarGravacao(); }}
                disabled={carregando}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none touch-none
                  ${gravando ? "bg-red-500 scale-110 shadow-lg shadow-red-400" : carregando ? "opacity-50 cursor-not-allowed" : "bg-transparent"}`}
              >
                <img src={darkMode ? "/Component 1-dark.png" : "/Component 1.png"} alt="Microfone" className="w-10 h-10 pointer-events-none" />
              </button>
              <p className="text-sm mt-2">
                {gravando ? "Gravando... aperte para parar" : carregando ? "Processando..." : "Aperte aqui para capturar o áudio"}
              </p>
            </div>
          )}



        {/* Navbar */}
        <div className="flex justify-center gap-6 mt-6 pb-4">
          <Link to="/textoTraducao">
            <img src={darkMode ? "/Component 3-dark.png" : "/Component 3.png"} className="h-10" />
          </Link>
          <Link to="/imgTraducao">
            <img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" />
          </Link>
          <img src={darkMode ? "/Component 1-select-dark.png" : "/Component 1-select.png"} className="h-10" />
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