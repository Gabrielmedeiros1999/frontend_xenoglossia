import { useState } from "react";
import { useIdioma } from "../context/IdiomaContext";
import { useIdiomasDisponiveis } from "./useIdiomasDisponiveis";

export type TipoSelecaoIdioma = "origem" | "destino";

/**
 * Estado + lógica do par de botões "idioma de origem / idioma de destino"
 * e do modal usado para trocá-los, incluindo a regra de "swap" (se o
 * idioma escolhido já está do outro lado, os dois trocam de lugar).
 *
 * Essa lógica era idêntica em TextoTraducao, ImgTraducao e VozTraducao.
 */
export function useSeletorIdiomas() {
  const idiomas = useIdiomasDisponiveis();
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino } = useIdioma();
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState<TipoSelecaoIdioma>("origem");

  function abrirModal(tipo: TipoSelecaoIdioma) {
    setTipoSelecao(tipo);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function handleSelecionar(nome: string, codigo: string) {
    const idioma = { nome, codigo };

    if (tipoSelecao === "origem") {
      if (codigo === idiomaDestino.codigo) setIdiomaDestino(idiomaOrigem);
      setIdiomaOrigem(idioma);
    } else {
      if (codigo === idiomaOrigem.codigo) setIdiomaOrigem(idiomaDestino);
      setIdiomaDestino(idioma);
    }
  }

  return {
    idiomas,
    idiomaOrigem,
    idiomaDestino,
    modalAberto,
    tipoSelecao,
    abrirModal,
    fecharModal,
    handleSelecionar,
  };
}
