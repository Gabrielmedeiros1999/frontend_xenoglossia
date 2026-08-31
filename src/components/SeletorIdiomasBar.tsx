import { useTheme } from "../context/ThemeContext";
import { ModalIdiomas } from "./ModalIdiomas";
import { useSeletorIdiomas } from "../hooks/useSeletorIdiomas";

interface SeletorIdiomasBarProps {
  /** TextoTraducao e ImgTraducao usam botões com largura fixa (w-25); VozTraducao não. */
  larguraFixa?: boolean;
  className?: string;
}

/**
 * Par de botões "idioma de origem ⇄ idioma de destino" + o modal de troca.
 * Concentra a UI que era repetida (com o mesmo JSX) nas 3 telas de tradução.
 * Idioma atual e a troca de idioma continuam vindo do IdiomaContext, então
 * qualquer outra parte da tela que precise de `idiomaOrigem`/`idiomaDestino`
 * pode seguir usando `useIdioma()` normalmente.
 */
export function SeletorIdiomasBar({ larguraFixa = false, className = "mb-4" }: SeletorIdiomasBarProps) {
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

  const botaoClasse = `h-8 ${larguraFixa ? "w-25 " : ""}px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${
    darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"
  }`;

  return (
    <>
      <div className={`flex gap-3 justify-center ${className}`}>
        <button onClick={() => abrirModal("origem")} className={botaoClasse}>
          {idiomaOrigem.nome}
        </button>

        <img src={darkMode ? "/typcn_arrow-up-outline-dark.png" : "/typcn_arrow-up-outline.png"} alt="seta" />

        <button onClick={() => abrirModal("destino")} className={botaoClasse}>
          {idiomaDestino.nome}
        </button>
      </div>

      {modalAberto && (
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
