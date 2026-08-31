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
import { BotaoOuvirTexto } from "./components/BotaoOuvirTexto";
import { NavegacaoTraducao } from "./components/NavegacaoTraducao";

type CampoVoz = "origem" | "destino";

const ATRASO_TRADUCAO_MS = 900;

export default function TextoTraducao() {
  const { darkMode } = useTheme();
  const { progresso, iniciar, concluir, cancelar } = useProgressoSimulado();
  const { idiomaOrigem, idiomaDestino } = useIdioma();

  const [textoOrigem, setTextoOrigem] = useState("");
  const [textoTraduzido, setTextoTraduzido] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { falando, falar } = useFalarTexto<CampoVoz>();
  const { sentimento, analisando, analisar, limpar: limparSentimento } = useSentimento();

  const abortRef = useRef<AbortController | null>(null);

  async function traduzir() {
    if (!textoOrigem.trim()) return;
    setCarregando(true);
    iniciar();
    limparSentimento();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await apiFetch("/traduzir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        cancelar();
        return;
      }

      setTextoTraduzido(data.traducao);
      concluir();
      registrarIdioma(idiomaOrigem.nome);
      registrarIdioma(idiomaDestino.nome);
      analisar(data.traducao);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) {
        // apiFetch já redireciona pro login; não precisa fazer nada aqui
        cancelar();
        return;
      }
      setTextoTraduzido("Erro ao traduzir. Tente novamente.");
      cancelar();
    } finally {
      setCarregando(false);
    }
  }

  // Traduz automaticamente `ATRASO_TRADUCAO_MS` depois que o usuário para de digitar.
  useEffect(() => {
    if (!textoOrigem.trim()) {
      setTextoTraduzido("");
      limparSentimento();
      return;
    }

    const timer = setTimeout(traduzir, ATRASO_TRADUCAO_MS);
    return () => clearTimeout(timer);
  }, [textoOrigem]);

  const placeholderClasse = darkMode ? "placeholder:text-cyan-500" : "placeholder:text-gray-500";

  return (
    <div className={`flex flex-col min-h-screen px-4 ${darkMode ? "bg-[#0F172A]" : "bg-gray-50"}`}>
      <div className="flex flex-col gap-4 mt-4">
        <SeletorIdiomasBar larguraFixa />

        {/* Área de texto origem */}
        <div className={`relative rounded-xl border ${darkMode ? "border-white" : "border-black"} mb-1`}>
          <textarea
            value={textoOrigem}
            onChange={(e) => setTextoOrigem(e.target.value)}
            placeholder={`Seu texto em ${idiomaOrigem.nome}`}
            rows={6}
            className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholderClasse}`}
          />

          {textoOrigem && (
            <BotaoOuvirTexto
              ativo={falando === "origem"}
              darkMode={darkMode}
              onClick={() => falar(textoOrigem, idiomaOrigem.codigo, "origem")}
            />
          )}
        </div>

        {/* Divisor */}
        <div className="w-full flex items-center gap-2 mb-6">
          <div className="flex-1 h-px bg-gray-400" />
          <img src={darkMode ? "/fluent_translate-auto-24-filled-dark.png" : "/fluent_translate-auto-24-filled.png"} alt="" />
          <div className="flex-1 h-px bg-gray-400" />
        </div>

        <CaixaResultadoTraducao
          resultado={textoTraduzido}
          carregando={carregando}
          progresso={progresso}
          placeholderPronto={`Seu texto em ${idiomaDestino.nome}`}
          sentimento={sentimento}
          analisando={analisando}
          darkMode={darkMode}
          falando={falando === "destino"}
          onFalar={() => falar(textoTraduzido, idiomaDestino.codigo, "destino")}
        />

        <NavegacaoTraducao paginaAtual="texto" darkMode={darkMode} />
      </div>
    </div>
  );
}
