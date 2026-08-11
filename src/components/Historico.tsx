import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import TraducaoCard from "./TraducaoCard";
import { useHistorico } from "../context/HistoricoContext";

type Traducao = {
    id: number;
    texto: string;
    traducao: string;
    origem: string;
    destino: string;
};

export default function Historico() {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const {
        historico,
        carregarHistorico,
        deletarTraducao,
    } = useHistorico();
    const [idiomas, setIdiomas] = useState<Record<string, string>>({});
    
    useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
        navigate("/", { replace: true });
    }
    }, [navigate]);

    useEffect(() => {
        fetch("/idiomas_pt.json")
            .then((res) => res.json())
            .then((data) => setIdiomas(data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        carregarHistorico();
    }, []);

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
        await deletarTraducao(id);
        toast.success("Tradução removida!");
    };

    function obterNomeIdioma(codigo: string) {
        const idioma = Object.entries(idiomas).find(
            ([_, valor]) => valor === codigo
        );

        return idioma ? idioma[0] : codigo;
    }

    return (
        <div
            className={`min-h-screen p-4 ${
                darkMode ? "bg-[#0B1A2B] text-white" : "bg-gray-200 text-black"
            }`}
        >
            <header className="flex justify-between p-3 mb-10">
                <img
                    src={darkMode ? "/icon-park-outline_left-dark.png" : "/icon-park-outline_left.png"}
                    alt="Voltar"
                    className="cursor-pointer -ml-3"
                    onClick={() => navigate(-1)}
                />
                <div className="flex items-center">
                    <img src="/Logo.png" className="h-13 -mr-6" />
                    <h1 className={`text-2xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-black"}`}>
                        Xenoglossia
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
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
    );
}