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
  return (
    <div
      className={`border rounded-lg p-3 border-black ${
        darkMode
          ? "bg-green-500 text-black"
          : "bg-blue-600 text-white"
      }`}
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
              className="w-5 h-5 cursor-pointer hover:scale-110 transition"
              onClick={() => onDelete(traducaoItem.id)}
            />
          )}

          {onCopy && (
            <img
              src="/streamline-ultimate_paper-write.png"
              alt="Copiar"
              className="w-5 h-5 cursor-pointer hover:scale-110 transition"
              onClick={() => onCopy(traducaoItem)}
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
    </div>
  );
}