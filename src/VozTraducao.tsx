import { useEffect, useRef, useState } from "react";
import { useTheme } from "./context/ThemeContext";
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";
import { apiFetch, SessaoExpiradaError } from "./utils/apiFetch";
import { useProgressoSimulado } from "./hooks/useProgressoSimulado";
import { useSentimento, buscarSentimento, type Sentimento } from "./hooks/useSentimento";
import { useFalarTexto } from "./hooks/useFalarTexto";
import { criarUtterance, falarUtterance } from "./utils/tts";
import { SeletorIdiomasBar } from "./components/SeletorIdiomasBar";
import { CaixaResultadoTraducao } from "./components/CaixaResultadoTraducao";
import { SentimentoBadge } from "./components/SentimentoBadge";
import { NavegacaoTraducao } from "./components/NavegacaoTraducao";

interface MensagemConversa {
  pessoa: 1 | 2;
  texto: string;
  traducao: string;
  sentimento?: Sentimento;
}

// Gravações mais curtas que isso (modo normal) são ignoradas — o usuário
// provavelmente só encostou no botão sem chegar a falar.
const DURACAO_MINIMA_MS = 400;

// Parâmetros da detecção de silêncio do modo conversação.
const LIMITE_VOLUME = 0.02;
const MAX_CICLOS_SILENCIO = 30; // ~3s de silêncio (30 ciclos de 100ms) encerra o turno
const INTERVALO_DETECCAO_MS = 100;
const SEGUNDOS_CONTAGEM_INICIAL = 5;

export default function VozTraducao() {
  const { darkMode } = useTheme();
  const { progresso, iniciar, concluir, cancelar } = useProgressoSimulado();
  const { idiomaOrigem, idiomaDestino } = useIdioma();

  // ── Modo normal (uma gravação por vez) ────────────────────────────────────
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const { falando, falar } = useFalarTexto<"resultado">();
  const { sentimento, analisando, analisar, limpar: limparSentimento } = useSentimento();

  // ── Modo conversação ───────────────────────────────────────────────────────
  const [modoConversa, setModoConversa] = useState(false);
  const [conversa, setConversa] = useState<MensagemConversa[]>([]);
  const [turnoAtual, setTurnoAtual] = useState<1 | 2>(1);
  const [contadorInicio, setContadorInicio] = useState<number | null>(null);
  const [mostrarInfoConversa, setMostrarInfoConversa] = useState(false);
  const [progressoSilencio, setProgressoSilencio] = useState(0);
  const conversaRef = useRef<HTMLDivElement>(null);
  const modoConversaRef = useRef(false);
  const turnoRef = useRef<1 | 2>(1);

  // Refs compartilhadas de gravação (usadas tanto no modo normal quanto na conversação)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const inicioGravacaoRef = useRef<number>(0);

  // Scroll automático da lista de mensagens da conversa
  useEffect(() => {
    if (conversaRef.current) {
      conversaRef.current.scrollTop = conversaRef.current.scrollHeight;
    }
  }, [conversa]);

  // Mantém o ref sincronizado com o estado (necessário pois callbacks assíncronos
  // de MediaRecorder/AudioContext leem o valor "ao vivo", não o valor da closure)
  useEffect(() => {
    turnoRef.current = turnoAtual;
  }, [turnoAtual]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      modoConversaRef.current = false;
    };
  }, []);

  // ── Gravação modo normal ───────────────────────────────────────────────────

  async function enviarAudio(audioBlob: Blob) {
    setCarregando(true);
    iniciar();
    limparSentimento();
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("origem", idiomaOrigem.codigo);
      formData.append("destino", idiomaDestino.codigo);

      const res = await apiFetch("/traduzir-voz", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // Backend retorna 400 com esse detail quando o Whisper não
      // transcreve nenhuma fala no áudio (ver /traduzir-voz em routes.py)
      const semFala =
        res.status === 400 &&
        typeof data.detail === "string" &&
        data.detail === "Nenhuma fala detectada no áudio";

      if (semFala) {
        setResultado("");
        cancelar();
        return;
      }

      if (!res.ok) {
        setResultado(`Erro: ${data.detail}`);
        cancelar();
        return;
      }

      // Transcrição/tradução veio vazia (silêncio): não mostra nada
      if (!data.traducao || !data.traducao.trim()) {
        setResultado("");
        cancelar();
        return;
      }

      setResultado(data.traducao);
      concluir();
      registrarIdioma(idiomaOrigem.nome);
      registrarIdioma(idiomaDestino.nome);
      analisar(data.traducao);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        cancelar();
        return;
      }
      setResultado("Erro ao conectar com o servidor");
      cancelar();
    } finally {
      setCarregando(false);
    }
  }

  async function iniciarGravacao() {
    if (gravando) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const duracao = Date.now() - inicioGravacaoRef.current;
        if (duracao < DURACAO_MINIMA_MS) {
          setResultado("");
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await enviarAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      inicioGravacaoRef.current = Date.now();
      setGravando(true);
    } catch (err) {
      console.error(err);
      setGravando(false);
    }
  }

  function pararGravacao() {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setGravando(false);
  }

  // ── Modo conversação ───────────────────────────────────────────────────────

  async function analisarSentimentoConversa(texto: string, indice: number) {
    const resultado = await buscarSentimento(texto);
    if (!resultado) return;

    setConversa((prev) => prev.map((msg, i) => (i === indice ? { ...msg, sentimento: resultado } : msg)));
  }

  async function iniciarGravacaoConversa() {
    if (!modoConversaRef.current) return;

    chunksRef.current = [];
    setProgressoSilencio(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (!modoConversaRef.current) return;

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processarTurno(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setGravando(true);

      iniciarDetectorDeSilencio(stream);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Monitora o volume do microfone e encerra a gravação automaticamente
   * depois que a pessoa fala e some ~3s de silêncio.
   */
  function iniciarDetectorDeSilencio(stream: MediaStream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;

    const dataArray = new Uint8Array(analyser.fftSize);

    let gravacaoFinalizada = false;
    let pessoaComecouFalar = false;
    let silencioAtual = 0;
    let detectorAtivo = true;

    const detectar = () => {
      if (!modoConversaRef.current || gravacaoFinalizada) return;

      analyser.getByteTimeDomainData(dataArray);

      let somaQuadrados = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const valor = (dataArray[i] - 128) / 128;
        somaQuadrados += valor * valor;
      }
      const volume = Math.sqrt(somaQuadrados / dataArray.length);

      if (volume > LIMITE_VOLUME) {
        // Detectou fala: reseta a contagem de silêncio.
        pessoaComecouFalar = true;
        silencioAtual = 0;
        setProgressoSilencio(0);
      } else if (pessoaComecouFalar) {
        // Já tinha falado e agora está em silêncio: conta os ciclos.
        silencioAtual++;
        setProgressoSilencio(Math.min(100, Math.round((silencioAtual / MAX_CICLOS_SILENCIO) * 100)));

        if (silencioAtual >= MAX_CICLOS_SILENCIO) {
          if (mediaRecorderRef.current?.state === "recording") {
            gravacaoFinalizada = true;
            detectorAtivo = false;
            mediaRecorderRef.current.stop();
            setGravando(false);
            setProgressoSilencio(0);
            return;
          }
        }
      }

      if (detectorAtivo) setTimeout(detectar, INTERVALO_DETECCAO_MS);
    };

    detectar();
  }

  async function processarTurno(audioBlob: Blob) {
    if (!modoConversaRef.current) return;

    setCarregando(true);
    const turno = turnoRef.current;
    const origemTurno = turno === 1 ? idiomaOrigem.codigo : idiomaDestino.codigo;
    const destinoTurno = turno === 1 ? idiomaDestino.codigo : idiomaOrigem.codigo;

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("origem", origemTurno);
      formData.append("destino", destinoTurno);

      const res = await apiFetch("/traduzir-voz", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) return;
      if (!modoConversaRef.current) return;

      const novaMensagem: MensagemConversa = {
        pessoa: turno,
        texto: data.texto_transcrito || "",
        traducao: data.traducao,
      };

      setConversa((prev) => {
        const novaLista = [...prev, novaMensagem];
        analisarSentimentoConversa(data.traducao, novaLista.length - 1);
        return novaLista;
      });

      const proximoTurno: 1 | 2 = turno === 1 ? 2 : 1;
      setTurnoAtual(proximoTurno);
      turnoRef.current = proximoTurno;

      // Fala a tradução e, assim que terminar (ou depois de um tempo limite de
      // segurança, caso o evento `onend` nunca dispare), inicia o próximo turno.
      let proximoTurnoIniciado = false;
      const iniciarProximoTurno = () => {
        if (modoConversaRef.current && !proximoTurnoIniciado) {
          proximoTurnoIniciado = true;
          iniciarGravacaoConversa();
        }
      };

      const utterance = criarUtterance(data.traducao, destinoTurno);
      const fallbackTimeout = setTimeout(iniciarProximoTurno, 1500);
      utterance.onend = () => {
        clearTimeout(fallbackTimeout);
        iniciarProximoTurno();
      };

      falarUtterance(utterance, destinoTurno);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        // Sessão caiu: encerra o modo conversação.
        modoConversaRef.current = false;
        setModoConversa(false);
        setGravando(false);
        return;
      }
      console.error("Erro no turno de conversação");
    } finally {
      setCarregando(false);
    }
  }

  function pararModoConversa() {
    // Desativa o ref PRIMEIRO — impede qualquer callback pendente de continuar
    modoConversaRef.current = false;
    speechSynthesis.cancel();

    // Para o stream do microfone diretamente (mais confiável que só parar o MediaRecorder)
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.ondataavailable = null; // ignora dados pendentes
        mediaRecorderRef.current.onstop = null; // ignora o onstop
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error("Erro ao parar gravação:", err);
    }
    mediaRecorderRef.current = null;

    setModoConversa(false);
    setGravando(false);
    setCarregando(false);
    setTurnoAtual(1);
    turnoRef.current = 1;
    setProgressoSilencio(0);
  }

  function iniciarModoConversa() {
    modoConversaRef.current = true;
    setModoConversa(true);
    setConversa([]);
    setTurnoAtual(1);
    turnoRef.current = 1;

    let segundosRestantes = SEGUNDOS_CONTAGEM_INICIAL;
    setContadorInicio(segundosRestantes);

    const intervalo = setInterval(() => {
      segundosRestantes--;

      if (segundosRestantes > 0) {
        setContadorInicio(segundosRestantes);
        return;
      }

      clearInterval(intervalo);
      setContadorInicio(null);
      if (modoConversaRef.current) iniciarGravacaoConversa();
    }, 1000);
  }

  function toggleModoConversa() {
    if (modoConversa) pararModoConversa();
    else iniciarModoConversa();
  }

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? "bg-[#0F172A] text-white" : "bg-gray-50 text-gray-800"}`}>
      <div className="flex flex-col gap-0 mt-1">
        <SeletorIdiomasBar className="mt-4 mb-4" disabled={gravando || modoConversa || carregando} />

        {/* Modo normal */}
        {!modoConversa && (
          <div className="flex justify-center mt-4 px-4">
            <CaixaResultadoTraducao
              resultado={resultado}
              carregando={carregando}
              progresso={progresso}
              placeholderPronto="Fala da pessoa convertido para texto"
              sentimento={sentimento}
              analisando={analisando}
              darkMode={darkMode}
              falando={falando === "resultado"}
              onFalar={() => falar(resultado, idiomaDestino.codigo, "resultado")}
              className={`flex flex-col justify-start w-full max-w-md h-56 ${darkMode ? "text-cyan-500" : ""}`}
            />
          </div>
        )}

        {/* Modo conversação */}
        {modoConversa && (
          <div className="flex flex-col items-center px-4 gap-3">
            {/* Indicador de turno */}
            <div className={`flex flex-col items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
              <span>
                {contadorInicio !== null
                  ? `A tradução vai começar em ${contadorInicio}s...`
                  : gravando && progressoSilencio > 0
                  ? `🤫 Pode parar de falar, já captei... (${progressoSilencio}%)`
                  : gravando
                  ? `🎙️ Pessoa ${turnoAtual} falando (${turnoAtual === 1 ? idiomaOrigem.nome : idiomaDestino.nome})`
                  : carregando
                  ? `Traduzindo...`
                  : `Aguardando Pessoa ${turnoAtual}...`}
              </span>

              {gravando && progressoSilencio > 0 && (
                <div className={`w-32 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-black/30" : "bg-black/10"}`}>
                  <div
                    className="h-full bg-yellow-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progressoSilencio}%` }}
                  />
                </div>
              )}
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
                  <div
                    className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                      msg.pessoa === 1
                        ? darkMode
                          ? "bg-green-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-zinc-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-1">{msg.texto}</p>
                    <p className="font-medium">{msg.traducao}</p>
                    {msg.sentimento && (
                      <div className="mt-1">
                        <SentimentoBadge sentimento={msg.sentimento} variante="compacta" />
                      </div>
                    )}
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
              src={darkMode ? "/material-symbols_info-outline-dark.png" : "/material-symbols_info-outline.png"}
              alt="Informação"
              className="cursor-pointer w-5 h-5"
              onMouseEnter={() => setMostrarInfoConversa(true)}
              onMouseLeave={() => setMostrarInfoConversa(false)}
              onClick={() => setMostrarInfoConversa((prev) => !prev)}
            />

            {mostrarInfoConversa && (
              <div
                className={`absolute z-50 top-7 left-1/2 -translate-x-1/2 w-45 p-3 rounded-xl text-xs shadow-lg ${
                  darkMode ? "bg-zinc-800 text-white border border-zinc-600" : "bg-white text-gray-800 border border-gray-300"
                }`}
              >
                O modo conversação permite tradução de voz em tempo real entre duas pessoas.
                <br />
                <br />
                A Pessoa 1 fala no idioma de origem e a fala é traduzida para o idioma de destino.
                <br />
                <br />
                Depois, a Pessoa 2 fala no idioma de destino e a fala é traduzida para o idioma de origem
                automaticamente.
              </div>
            )}
          </div>

          <span className="font-bold">Modo Conversação</span>
          <button
            onClick={toggleModoConversa}
            disabled={carregando}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${modoConversa ? "bg-[#7C3AED]" : "bg-gray-400"}`}
          >
            <div
              className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 ${darkMode ? "bg-black" : "bg-white"} ${
                modoConversa ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Botão de gravação (modo normal) */}
        {!modoConversa && (
          <div className="flex flex-col items-center justify-center py-15 select-none">
            <button
              onClick={() => (gravando ? pararGravacao() : iniciarGravacao())}
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

        <NavegacaoTraducao paginaAtual="voz" darkMode={darkMode} className={`gap-6 pb-4 ${!modoConversa ? "-mt-10" : "mt-6"}`} />
      </div>
    </div>
  );
}
