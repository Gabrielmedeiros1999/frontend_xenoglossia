import { useState } from "react";

type Traducao = {
  id: number;
  texto: string;
  traducao: string;
  origem: string;
  destino: string;
};

type TraducaoCardProps = {
  traducaoItem: Traducao;
  darkMode: boolean;
  obterNomeIdioma: (codigo: string) => string;
  onDelete?: (id: number) => void;
  onCopy?: (item: Traducao) => void;
};

export default function TraducaoCard({
  traducaoItem,
  darkMode,
  obterNomeIdioma,
  onDelete,
  onCopy,
}: TraducaoCardProps) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    if (excluindo) return;

    setExcluindo(true);
    setMostrarModal(false);

    try {
      await onDelete?.(traducaoItem.id);
    } catch (err) {
      // Se falhar, libera as ações novamente para o usuário tentar de novo
      setExcluindo(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 border-black transition-opacity ${
        darkMode
          ? "bg-green-500 text-black"
          : "bg-blue-600 text-white"
      } ${excluindo ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">
            De: {obterNomeIdioma(traducaoItem.origem)}
          </p>

          <p className="font-bold">
            Para: {obterNomeIdioma(traducaoItem.destino)}
          </p>
        </div>

        <div className="flex gap-3">
          {onDelete && (
            <img
              src="/Cancel.png"
              alt="Excluir"
              className={`w-5 h-5 transition ${
                excluindo
                  ? "opacity-40 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer hover:scale-110"
              }`}
              onClick={() => !excluindo && setMostrarModal(true)}
            />
          )}

          {onCopy && (
            <img
              src="/streamline-ultimate_paper-write.png"
              alt="Copiar"
              className={`w-5 h-5 transition ${
                excluindo
                  ? "opacity-40 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer hover:scale-110"
              }`}
              onClick={() => !excluindo && onCopy(traducaoItem)}
            />
          )}
        </div>
      </div>

      <hr className="my-2" />

      <p className="font-semibold">Original</p>
      <p>{traducaoItem.texto}</p>

      <hr className="my-2" />

      <p className="font-semibold">Tradução</p>
      <p>{traducaoItem.traducao}</p>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-72 text-center shadow-lg ${darkMode ? " bg-[#0F172A] text-cyan-500" : "bg-gray-50 text-black"}`}>
            <p className="font-bold mb-6">
              Você deseja apagar essa tradução?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="px-6 py-1 rounded-md font-bold bg-red-600 text-white cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sim
              </button>

              <button
                onClick={() => setMostrarModal(false)}
                className={`px-6 py-1 rounded-md font-bold cursor-pointer hover:opacity-90 ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}