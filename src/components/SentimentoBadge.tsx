import type { Sentimento } from "../hooks/useSentimento";

const LABELS: Record<Sentimento, string> = {
  positivo: "Sentimento positivo",
  negativo: "Sentimento negativo",
  neutro: "Sentimento neutro",
};

const EMOJIS: Record<Sentimento, string> = {
  positivo: "😊 Positivo",
  negativo: "😡 Negativo",
  neutro: "😐 Neutro",
};

const CORES_NORMAL: Record<Sentimento, string> = {
  positivo: "bg-green-500/20 text-green-600",
  negativo: "bg-red-500/20 text-red-600",
  neutro: "bg-gray-500/20 text-gray-600",
};

const CORES_COMPACTA: Record<Sentimento, string> = {
  positivo: "bg-white/90 text-green-700",
  negativo: "bg-white/90 text-red-700",
  neutro: "bg-white/90 text-gray-700",
};

interface SentimentoBadgeProps {
  sentimento: Sentimento;
  /** "normal": usada no topo das caixas de resultado. "compacta": usada dentro dos balões do modo conversação. */
  variante?: "normal" | "compacta";
}

export function SentimentoBadge({ sentimento, variante = "normal" }: SentimentoBadgeProps) {
  const cores = variante === "normal" ? CORES_NORMAL[sentimento] : CORES_COMPACTA[sentimento];
  const tamanho = variante === "normal" ? "px-2 py-0.5 text-xs" : "mt-1 px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cores} ${tamanho}`}
      title={LABELS[sentimento]}
    >
      {EMOJIS[sentimento]}
    </span>
  );
}

interface SentimentoIndicadorProps {
  sentimento: Sentimento | null;
  carregando: boolean;
  analisando: boolean;
}

/**
 * Wrapper usado no topo das caixas de resultado: só aparece quando já temos
 * um sentimento calculado e nenhuma tradução/análise está em andamento.
 */
export function SentimentoIndicador({ sentimento, carregando, analisando }: SentimentoIndicadorProps) {
  if (carregando || analisando || !sentimento) return null;

  return (
    <div className="flex justify-start px-4 pt-3">
      <SentimentoBadge sentimento={sentimento} />
    </div>
  );
}
