import { useCallback, useState } from "react";
import { criarUtterance, falarUtterance } from "../utils/tts";

/**
 * Controla o botão de "ouvir texto" (🔊) de uma tela.
 *
 * `Campo` é o identificador de qual caixa de texto está falando no momento
 * (ex.: "origem" | "destino", ou só "resultado"). Clicar de novo no mesmo
 * campo enquanto ele fala cancela a leitura.
 */
export function useFalarTexto<Campo extends string>() {
  const [falando, setFalando] = useState<Campo | null>(null);

  const falar = useCallback(
    (texto: string, idioma: string, campo: Campo) => {
      if (!texto) return;

      if (falando === campo) {
        speechSynthesis.cancel();
        setFalando(null);
        return;
      }

      const utterance = criarUtterance(texto, idioma);
      utterance.onstart = () => setFalando(campo);
      utterance.onend = () => setFalando(null);
      utterance.onerror = () => setFalando(null);

      falarUtterance(utterance, idioma);
    },
    [falando]
  );

  return { falando, falar };
}
