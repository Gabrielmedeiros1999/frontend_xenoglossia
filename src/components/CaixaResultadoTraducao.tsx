import type { Sentimento } from "../hooks/useSentimento";
import { SentimentoIndicador } from "./SentimentoBadge";
import { BotaoOuvirTexto } from "./BotaoOuvirTexto";

interface CaixaResultadoTraducaoProps {
  resultado: string;
  carregando: boolean;
  progresso: number;
  placeholderPronto: string;
  sentimento: Sentimento | null;
  analisando: boolean;
  darkMode: boolean;
  falando: boolean;
  onFalar: () => void;
  /** Classes extras aplicadas na caixa (usado pelo VozTraducao para o tamanho fixo do modo normal). */
  className?: string;
}

/**
 * Caixa de resultado (readOnly) com: badge de sentimento, barra de progresso
 * durante a tradução e botão de "ouvir". É o bloco de JSX que se repetia,
 * quase idêntico, em TextoTraducao (caixa de destino), ImgTraducao e
 * VozTraducao (modo normal).
 */
export function CaixaResultadoTraducao({
  resultado,
  carregando,
  progresso,
  placeholderPronto,
  sentimento,
  analisando,
  darkMode,
  falando,
  onFalar,
  className = "",
}: CaixaResultadoTraducaoProps) {
  const placeholderClasse = darkMode ? "placeholder:text-cyan-500" : "placeholder:text-gray-500";

  return (
    <div
      className={`relative rounded-xl border ${
        darkMode ? "bg-zinc-700 border-white" : "bg-zinc-200 border-black"
      } mb-6 ${className}`}
    >
      <SentimentoIndicador sentimento={sentimento} carregando={carregando} analisando={analisando} />

      <textarea
        value={carregando ? "" : resultado}
        readOnly
        placeholder={carregando ? `Traduzindo... ${progresso}%` : placeholderPronto}
        rows={6}
        className={`w-full bg-transparent p-4 outline-none resize-none text-sm ${placeholderClasse}`}
      />

      {carregando && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10">
          <div
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
      )}

      {!carregando && resultado && (
        <BotaoOuvirTexto ativo={falando} darkMode={darkMode} onClick={onFalar} />
      )}
    </div>
  );
}
