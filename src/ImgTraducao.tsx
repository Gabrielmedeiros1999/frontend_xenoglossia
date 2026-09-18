import { useEffect, useRef, useState } from "react";
import { useTheme } from "./context/ThemeContext";
import { useIdioma } from "./context/IdiomaContext";
import { registrarIdioma } from "./utils/idiomaFavorito";
import { apiFetch, SessaoExpiradaError } from "./utils/apiFetch";
import { useProgressoSimulado } from "./hooks/useProgressoSimulado";
import { useSentimento } from "./hooks/useSentimento";
import { useFalarTexto } from "./hooks/useFalarTexto";
import { SeletorIdiomasBar } from "./components/SeletorIdiomasBar";
import { CaixaResultadoTraducao } from "./components/CaixaResultadoTraducao";
import { NavegacaoTraducao } from "./components/NavegacaoTraducao";

export default function ImgTraducao() {
  const { darkMode } = useTheme();
  const { progresso, iniciar, concluir, cancelar } = useProgressoSimulado();
  const { idiomaOrigem, idiomaDestino } = useIdioma();

  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { falando, falar } = useFalarTexto<"resultado">();
  const { sentimento, analisando, analisar, limpar: limparSentimento } = useSentimento();

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  function limparResultadoAtual() {
    setResultado("");
    limparSentimento();
  }

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagem(file);
    setPreview(URL.createObjectURL(file));
    limparResultadoAtual();
    enviarImagemDireto(file);
  }

  async function enviarImagemDireto(file: File) {
    setCarregando(true);
    iniciar();
    limparSentimento();

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
      analisar(data.traducao);
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
        video: { facingMode: "environment" },
      });

      setStream(mediaStream);
      setCameraAtiva(true);

      // espera o componente renderizar antes de plugar o stream no <video>
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
      limparResultadoAtual();

      enviarImagemDireto(file);
    }, "image/jpeg");

    fecharCamera();
  }

  function fecharCamera() {
    stream?.getTracks().forEach((track) => track.stop());
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
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  return (
    <div className={`flex flex-col min-h-screen px-4 ${darkMode ? "bg-[#0F172A]" : "bg-gray-50"}`}>
      <div className="flex flex-col gap-4 mt-4">
        <SeletorIdiomasBar larguraFixa disabled={carregando}  />

        {/* Área de upload */}
        <div className="flex flex-col items-center gap-3 rounded-xl px-4 py-5">
          <label className="w-full cursor-pointer">
            <div className={`flex items-center gap-2 rounded-md border text-sm ${darkMode ? "border-white text-white" : "border-black text-black"}`}>
              <span className={`text-xs font-medium w-auto pl-2 pr-1 pb-2 pt-2 rounded border border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
                Escolher Arquivo
              </span>
              <span className="truncate text-xs">{imagem ? imagem.name : "Nenhum arquivo selecionado"}</span>
            </div>
            <input ref={inputFileRef} type="file" accept="image/*" onChange={handleImagem} className="hidden" />
          </label>

          {!preview && (
            <>
              <p className={`text-sm font-semibold ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>OU</p>

              <button onClick={abrirCamera}>
                <img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" alt="Abrir câmera" />
              </button>
              <span className={`text-xs text-center ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
                Tire uma foto do que deseja traduzir
              </span>
            </>
          )}

          {preview && (
            <div className="w-full relative">
              <img src={preview} alt="preview" className="w-full max-h-48 object-contain rounded-lg" />
              <button
                onClick={() => {
                  setImagem(null);
                  setPreview(null);
                  limparResultadoAtual();
                  if (inputFileRef.current) inputFileRef.current.value = "";
                }}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <CaixaResultadoTraducao
          resultado={resultado}
          carregando={carregando}
          progresso={progresso}
          placeholderPronto={`Tradução do texto da imagem em ${idiomaDestino.nome}`}
          sentimento={sentimento}
          analisando={analisando}
          darkMode={darkMode}
          falando={falando === "resultado"}
          onFalar={() => falar(resultado, idiomaDestino.codigo, "resultado")}
        />

        <NavegacaoTraducao paginaAtual="imagem" darkMode={darkMode} />
      </div>

      {cameraAtiva && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 h-dvh overflow-hidden">
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg" />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="shrink-0 flex gap-4 my-4">
            <button onClick={tirarFoto} className="bg-green-500 px-4 py-2 rounded text-black">
              Tirar Foto
            </button>
            <button onClick={fecharCamera} className="bg-red-500 px-4 py-2 rounded text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
