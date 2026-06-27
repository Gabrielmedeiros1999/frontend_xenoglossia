import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import TraducaoCard from "./TraducaoCard";
import { useHistorico } from "../context/HistoricoContext";


type HistoricoProps = {
    isOpen: boolean;
    onClose: () => void;
};

type Traducao = {
    id: number;
    texto: string;
    traducao: string;
    origem: string;
    destino: string;
};

export default function Historico({
    isOpen,
    onClose,
}: HistoricoProps) {
    const {
    historico,
    carregarHistorico,
    deletarTraducao,
    } = useHistorico();
    const [idiomas, setIdiomas] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch("/idiomas_pt.json")
            .then((res) => res.json())
            .then((data) => setIdiomas(data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        carregarHistorico();
    }, [isOpen]);

    const { darkMode } = useTheme();

    const copiarTraducao = (item: Traducao) => {
        const conteudo = `
         De: ${obterNomeIdioma(item.origem)}
         Para: ${obterNomeIdioma(item.destino)}

        Original:
        ${item.texto}

        Tradução:
       ${item.traducao}
       `;

        navigator.clipboard.writeText(conteudo);
    };

    const handleDelete = async (id: number) => {
    const confirmar = window.confirm(
        "Tem certeza que deseja excluir esta tradução?"
    );

    if (!confirmar) return;

    await deletarTraducao(id);

    toast.success("Tradução removida!");
   };  

    if (!isOpen) return null;

    function obterNomeIdioma(codigo: string) {
        const idioma = Object.entries(idiomas).find(
            ([_, valor]) => valor === codigo
        );

        return idioma ? idioma[0] : codigo;
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className={` w-[90%] max-w-4xl rounded-xl p-4 ${darkMode ? "bg-[#0B1A2B]" : "bg-gray-200"}`}>

                    <div className="flex justify-end mb-4">
                        <img
                            src={darkMode ? "/Component 7-dark.png" : "/Component 7.png"}
                            className="cursor-pointer"
                            onClick={onClose}
                            alt="Fechar"
                        />
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {historico.length === 0 ? (
                            <div className="text-center py-10">
                                <h3 className="text-xl font-bold mb-2">
                                    Nenhuma tradução encontrada
                                </h3>

                                <p className="text-gray-500">
                                    Faça algumas traduções para que elas apareçam aqui.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {historico.map((item) => (
                                    <TraducaoCard
                                        key={item.id}
                                        traducaoItem={item}
                                        darkMode={darkMode}
                                        obterNomeIdioma={obterNomeIdioma}
                                        onDelete={handleDelete}
                                        onCopy={copiarTraducao}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}