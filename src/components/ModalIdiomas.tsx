import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface Props {
  idiomas: Record<string, string>;
  tipoSelecao: "origem" | "destino";
  onSelecionar: (nome: string, codigo: string) => void;
  onFechar: () => void;
}

export function ModalIdiomas({ idiomas, onSelecionar, onFechar }: Props) {
  const { darkMode } = useTheme();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const carregando = Object.keys(idiomas).length === 0; 

  const listaFiltrada = Object.entries(idiomas).filter(([nome]) =>
    nome.toLowerCase().includes(busca.toLowerCase())
  );

  function confirmar() {
    if (!selecionado) return;
    const nome = Object.keys(idiomas).find((key) => idiomas[key] === selecionado)!;
    onSelecionar(nome, selecionado);
    onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`w-80 rounded-2xl p-5 relative shadow-xl ${darkMode ? "bg-black" : "bg-white"}`}>

        {/* FECHAR */}
        <div className="flex justify-end mb-3">
          <img
            src={darkMode ? "/Component 7-dark.png" : "/Component 7.png"}
            className="cursor-pointer"
            onClick={onFechar}
            alt="Fechar"
          />
        </div>

        {/* BUSCA */}
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-3 ${darkMode ? "border-white" : "border-black"}`}>
          <input
            type="text"
            placeholder="Pesquisar um idioma"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`w-full bg-transparent outline-none text-sm ${darkMode ? "text-white placeholder:text-cyan-500" : "text-black placeholder:text-gray-400"}`}
          />
          {busca && (
            <button onClick={() => setBusca("")} className="shrink-0">
              <img
                src={darkMode ? "/Component 7-dark.png" : "/Component 7.png"}
                className="cursor-pointer h-5"
                alt="Limpar"
              />
            </button>
          )}
        </div>

        {/* LISTA */}
        <div className={`h-52 overflow-y-auto rounded-lg border mb-4 scroll-custom ${darkMode ? "border-white" : "border-black"}`}>
            {carregando ? (
            <div className="flex items-center justify-center h-full">  
            <p className={`text-sm ${darkMode ? "text-cyan-500" : "text-gray-400"}`}>
              Carregando idiomas...
             </p>
           </div>
          ) : (
          <div className="grid grid-cols-2 gap-x-2">
            {listaFiltrada.map(([nome, codigo]) => (
              <div
                key={codigo}
                onClick={() => setSelecionado(codigo)}
                className={`px-3 py-2 cursor-pointer text-sm transition
                  ${selecionado === codigo
                    ? darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"
                    : darkMode ? "hover:bg-green-500 text-white" : "hover:bg-gray-200"
                  }`}
              >
                {nome}
              </div>
            ))}
          </div>
          )} 
        </div>

        {/* BOTÃO */}
        <button
          onClick={confirmar}
          className={`w-full cursor-pointer py-2 rounded ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}
        >
          Selecionar
        </button>
      </div>
    </div>
  );
}