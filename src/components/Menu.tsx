import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getIdiomaFavorito } from "../utils/idiomaFavorito";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Historico from "./Historico";
import TraducaoCard from "./TraducaoCard";

type MenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function Menu({ isOpen, onClose }: MenuProps) {
  const { darkMode, toggleTheme } = useTheme();
  const idiomaFavorito = getIdiomaFavorito();
  const navigate = useNavigate();
  const usuarioSalvo = localStorage.getItem("usuario");
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [ultimaTraducao, setUltimaTraducao] = useState<any>(null);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    toast.success("Você saiu da conta!");

    onClose();

    navigate("/");
  };

  useEffect(() => {
    if (isOpen && usuario) {
      carregarUltimaTraducao();
    }
  }, [isOpen]);

  useEffect(() => {
    fetch("/idiomas_pt.json")
      .then((res) => res.json())
      .then((data) => setIdiomas(data))
      .catch((err) => console.error(err));
  }, []);

  function obterNomeIdioma(codigo: string) {
    const idioma = Object.entries(idiomas).find(
      ([_, valor]) => valor === codigo
    );

    return idioma ? idioma[0] : codigo;
  }

  const deletarTraducao = async (id: number) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/historico/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao deletar");
      }

      toast.success("Tradução removida!");

      setUltimaTraducao(null);

    } catch (error) {
      toast.error("Erro ao remover tradução");
      console.error(error);
    }
  };

  const copiarTraducao = (item: any) => {
    const conteudo = `
De: ${obterNomeIdioma(item.origem)}
Para: ${obterNomeIdioma(item.destino)}

Original:
${item.texto}

Tradução:
${item.traducao}
`;

    navigator.clipboard.writeText(conteudo);

    toast.success("Tradução copiada!");
  };

  const carregarUltimaTraducao = async () => {
    try {
     
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/historico?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setUltimaTraducao(data[0]);
      }
    } catch (error) {
      console.error(error);
    } 
  };

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        ${darkMode ? "bg-[#0B1A2B] text-white" : "bg-gray-200 text-black"}`}
      >
        <div className="p-4 flex flex-col h-full">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <img
              src={darkMode ? "/Component 7-dark.png" : "/Component 7.png"}
              alt="Fechar"
              className="h-6 cursor-pointer"
              onClick={onClose}
            />

            <h2 className="font-bold">
              {usuario
                ? `Olá, ${usuario.nome}!`
                : "Olá!"
              }
            </h2>
          </div>

          {/* TEMA */}
          <div className="flex items-center  mb-6 ">
            <h2 className="font-bold p-1 text-2xl">Tema</h2>
            <img src={darkMode ? "/Component 12-dark.png" : "/Component 12.png"}
              alt="altera tema"
              className=" h-9 cursor-pointer transition-transform duration-150 active:scale-90"
              onClick={toggleTheme}
            />
          </div>

          {/* PERFIL */}
          <Link to={usuario ? "/perfil" : "/login"}>
            <button className={`w-full cursor-pointer py-2 rounded-md mb-4 font-bold ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}>
              Perfil
            </button>
          </Link>
          {/* HISTÓRICO */}
          <div className="border rounded-md p-4 text-center mb-4">
            {!usuario && (
              <>
                <p className="font-bold mb-2">Histórico</p>
                <p className="font-bold">
                  Faça{" "}
                  <Link to='/login'>
                    <button className={` py-1 px-2 rounded-md mb-4 cursor-pointer ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}>
                      Login
                    </button>
                  </Link>{" "}
                  para acessar seu histórico
                </p>
              </>
            )}
            {usuario && (
              <>
                <p className="font-bold mb-2">Sua última Tradução</p>
                <div className="mb-4">
                {ultimaTraducao && (
                  <TraducaoCard
                    traducaoItem={ultimaTraducao}
                    darkMode={darkMode}
                    obterNomeIdioma={obterNomeIdioma}
                    onDelete={deletarTraducao}
                    onCopy={copiarTraducao}
                  />
                )}
                </div>
                <button onClick={() => setHistoricoOpen(true)} className={`px-15 py-1 rounded font-bold cursor-pointer  ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}>
                  Ver histórico
                </button>
              </>
            )}
          </div>

          {/* LINGUAGEM */}
          <div className="border rounded-md p-4 text-center mb-4">
            <p className="mb-2 font-bold">Linguagem Favorita</p>
            <button className={`px-19 py-1 rounded border font-bold ${darkMode ? "bg-green-500 border-white text-black" : "bg-blue-600 border-black text-white"}`}>
              {idiomaFavorito}
            </button>
          </div>
          {usuario && (
            <button onClick={handleLogout} className="w-full cursor-pointer py-2 rounded-md mb-4 font-bold bg-red-600  text-white border border-black">
              Sair
            </button>
          )}
        </div>
      </div>
      <Historico
        isOpen={historicoOpen}
        onClose={() => setHistoricoOpen(false)}
      />
    </>
  );
}