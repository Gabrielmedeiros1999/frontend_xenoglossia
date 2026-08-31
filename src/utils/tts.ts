/**
 * Utilitários de "text-to-speech" (SpeechSynthesis) usados por todas as
 * telas de tradução. Antes essa lógica (criar a utterance, escolher a voz
 * certa pro idioma, esperar `voiceschanged` quando necessário) estava
 * duplicada em TextoTraducao, ImgTraducao e VozTraducao.
 */

export function criarUtterance(texto: string, idioma: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = idioma;
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;
  return utterance;
}

/**
 * Cancela qualquer fala em andamento e dispara a utterance, escolhendo
 * (quando disponível) uma voz cujo `lang` combine com o idioma pedido.
 * As vozes do navegador podem carregar de forma assíncrona, por isso
 * esperamos o evento `voiceschanged` quando a lista ainda está vazia.
 */
export function falarUtterance(utterance: SpeechSynthesisUtterance, idioma: string) {
  speechSynthesis.cancel();

  const disparar = () => {
    const vozes = speechSynthesis.getVoices();
    const vozIdioma = vozes.find((v) => v.lang.startsWith(idioma));
    if (vozIdioma) utterance.voice = vozIdioma;
    speechSynthesis.speak(utterance);
  };

  if (speechSynthesis.getVoices().length > 0) {
    disparar();
  } else {
    speechSynthesis.addEventListener("voiceschanged", disparar, { once: true });
  }
}
