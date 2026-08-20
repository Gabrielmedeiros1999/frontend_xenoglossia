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

const LIMITE_HISTORICO = 100;

export default function Historico() {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const {
        historico,
        carregarHistorico,
        deletarTraducao,
        apagarTodoHistorico,
    } = useHistorico();
    const [idiomas, setIdiomas] = useState<Record<string, string>>({});
    const [mostrarModalApagarTudo, setMostrarModalApagarTudo] = useState(false);
    const [apagandoTudo, setApagandoTudo] = useState(false);

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

    const handleApagarTudo = async () => {
        if (apagandoTudo) return;

        setApagandoTudo(true);
        setMostrarModalApagarTudo(false);

        try {
            await apagarTodoHistorico();
            toast.success("Histórico apagado!");
        } catch (err) {
            toast.error("Erro ao apagar histórico. Tente novamente.");
        } finally {
            setApagandoTudo(false);
        }
    };

    function obterNomeIdioma(codigo: string) {
        const idioma = Object.entries(idiomas).find(
            ([_, valor]) => valor === codigo
        );

        return idioma ? idioma[0] : codigo;
    }

    const totalSalvas = Array.isArray(historico) ? historico.length : 0;
    const percentual = Math.min((totalSalvas / LIMITE_HISTORICO) * 100, 100);
    const proximoDoLimite = totalSalvas >= LIMITE_HISTORICO * 0.9;
    const noLimite = totalSalvas >= LIMITE_HISTORICO;

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
                {totalSalvas > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span
                                className={
                                    noLimite
                                        ? "text-red-500 font-semibold"
                                        : proximoDoLimite
                                        ? "text-yellow-500 font-semibold"
                                        : darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                }
                            >
                                {noLimite
                                    ? `Limite atingido: ${totalSalvas}/${LIMITE_HISTORICO} traduções`
                                    : `${totalSalvas}/${LIMITE_HISTORICO} traduções salvas`}
                            </span>

                            <button
                                onClick={() => setMostrarModalApagarTudo(true)}
                                disabled={apagandoTudo}
                                className={`text-xs font-semibold rounded-md p-2  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white bg-red-600`}
                            >
                                Apagar tudo
                            </button>
                        </div>

                        <div
                            className={`w-full h-2 rounded-full overflow-hidden ${
                                darkMode ? "bg-gray-700" : "bg-gray-300"
                            }`}
                        >
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    noLimite
                                        ? "bg-red-500"
                                        : proximoDoLimite
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                }`}
                                style={{ width: `${percentual}%` }}
                            />
                        </div>

                        {noLimite && (
                            <p
                                className={`text-xs mt-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                                As traduções mais antigas serão removidas automaticamente ao salvar novas.
                            </p>
                        )}
                    </div>
                )}

                {!Array.isArray(historico) || historico.length === 0 ? (
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

            {mostrarModalApagarTudo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`rounded-lg p-6 w-72 text-center shadow-lg ${darkMode ? "bg-[#0F172A] text-cyan-500" : "bg-gray-50 text-black"}`}>
                        <p className="font-bold mb-6">
                            Apagar todas as {totalSalvas} traduções do histórico? Essa ação não pode ser desfeita.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleApagarTudo}
                                disabled={apagandoTudo}
                                className="px-6 py-1 rounded-md font-bold bg-red-600 text-white cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sim
                            </button>

                            <button
                                onClick={() => setMostrarModalApagarTudo(false)}
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