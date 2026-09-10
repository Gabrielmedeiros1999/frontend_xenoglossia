interface BotaoLimparTextoProps {
  darkMode: boolean;
  onClick: () => void;
  className?: string;
}

/** Botão de ❌ usado para limpar o conteúdo de uma caixa de texto. */
export function BotaoLimparTexto({ darkMode, onClick, className = "absolute top-2 right-14" }: BotaoLimparTextoProps) {
  return (
    <button onClick={onClick} className={className} aria-label="Limpar texto">
      <img
        src={darkMode ? "/Close-dark.png" : "/Close.png"}
        alt="limpar"
        className="w-8 h-8 cursor-pointer transition-transform hover:scale-110"
      />
    </button>
  );
}