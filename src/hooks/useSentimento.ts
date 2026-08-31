import { useCallback, useState } from "react";
import { apiFetch, SessaoExpiradaError } from "../utils/apiFetch";

export type Sentimento = "positivo" | "negativo" | "neutro";

function ehSentimentoValido(valor: unknown): valor is Sentimento {
  return valor === "positivo" || valor === "negativo" || valor === "neutro";
}

/**
 * Chama /analisar-sentimento para um texto avulso e devolve o resultado
 * (ou `null` se a chamada falhar / o texto vier vazio). Usada fora de
 * componentes React, por exemplo dentro do modo conversação, onde o
 * resultado precisa ser associado a uma mensagem específica da lista.
 */
export async function buscarSentimento(texto: string): Promise<Sentimento | null> {
  if (!texto.trim()) return null;

  try {
    const res = await apiFetch("/analisar-sentimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });

    const data = await res.json();
    if (!res.ok) return null;

    return ehSentimentoValido(data.sentimento) ? data.sentimento : null;
  } catch {
    // Falha silenciosa: sentimento é um extra, não deve travar o fluxo principal.
    return null;
  }
}

/**
 * Versão "stateful" de `buscarSentimento`, pronta para caixas de texto
 * simples (uma única tradução na tela por vez).
 */
export function useSentimento() {
  const [sentimento, setSentimento] = useState<Sentimento | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const analisar = useCallback(async (texto: string) => {
    if (!texto.trim()) {
      setSentimento(null);
      return;
    }

    setAnalisando(true);
    try {
      const res = await apiFetch("/analisar-sentimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });

      const data = await res.json();
      setSentimento(res.ok && ehSentimentoValido(data.sentimento) ? data.sentimento : null);
    } catch (e) {
      if (e instanceof SessaoExpiradaError) return;
      setSentimento(null);
    } finally {
      setAnalisando(false);
    }
  }, []);

  const limpar = useCallback(() => setSentimento(null), []);

  return { sentimento, analisando, analisar, limpar };
}
