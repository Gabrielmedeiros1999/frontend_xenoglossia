import { useTheme } from "../context/ThemeContext";
import { ModalIdiomas } from "./ModalIdiomas";
import { useSeletorIdiomas } from "../hooks/useSeletorIdiomas";

interface SeletorIdiomasBarProps {
  /** TextoTraducao e ImgTraducao usam botões com largura fixa (w-25); VozTraducao não. */
  larguraFixa?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SeletorIdiomasBar({
  larguraFixa = false,
  className = "mb-4",
  disabled = false,
}: SeletorIdiomasBarProps) {
  const { darkMode } = useTheme();
  const {
    idiomas,
    idiomaOrigem,
    idiomaDestino,
    modalAberto,
    tipoSelecao,
    abrirModal,
    fecharModal,
    handleSelecionar,
  } = useSeletorIdiomas();

  const botaoClasse = `h-8 ${larguraFixa ? "w-25 " : ""}px-4 py-1 rounded-md text-sm border border-black ${
    darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"
  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;

  const handleAbrirModal = (tipo: "origem" | "destino") => {
    if (disabled) return;
    abrirModal(tipo);
  };

  return (
    <>
      <div className={`flex gap-3 justify-center ${className}`}>
        <button
          onClick={() => handleAbrirModal("origem")}
          disabled={disabled}
          className={botaoClasse}
        >
          {idiomaOrigem.nome}
        </button>

        <img src={darkMode ? "/typcn_arrow-up-outline-dark.png" : "/typcn_arrow-up-outline.png"} alt="seta" />

        <button
          onClick={() => handleAbrirModal("destino")}
          disabled={disabled}
          className={botaoClasse}
        >
          {idiomaDestino.nome}
        </button>
      </div>

      {modalAberto && !disabled && (
        <ModalIdiomas
          idiomas={idiomas}
          tipoSelecao={tipoSelecao}
          onSelecionar={handleSelecionar}
          onFechar={fecharModal}
        />
      )}
    </>
  );
}