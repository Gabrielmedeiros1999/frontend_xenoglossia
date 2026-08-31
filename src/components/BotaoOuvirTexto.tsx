interface BotaoOuvirTextoProps {
  ativo: boolean;
  darkMode: boolean;
  onClick: () => void;
  className?: string;
}

/** Botão de 🔊 usado em toda caixa de texto/resultado que suporta leitura em voz alta. */
export function BotaoOuvirTexto({ ativo, darkMode, onClick, className = "absolute top-2 right-2" }: BotaoOuvirTextoProps) {
  return (
    <button onClick={onClick} className={className} aria-label={ativo ? "Parar leitura" : "Ouvir texto"}>
      <img
        src={darkMode ? "/Voice Recognition-dark.png" : "/Voice Recognition.png"}
        alt="ouvir"
        className={`w-8 h-8 cursor-pointer transition-transform ${ativo ? "scale-110 animate-pulse" : ""}`}
      />
    </button>
  );
}
