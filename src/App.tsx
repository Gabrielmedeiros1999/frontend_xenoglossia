import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import { ModalIdiomas } from "./components/ModalIdiomas";
import { Link } from "react-router-dom"
import { useIdioma } from "./context/IdiomaContext";

function App() {
  const { darkMode } = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});
  const { idiomaOrigem, idiomaDestino, setIdiomaOrigem, setIdiomaDestino} = useIdioma();
  const [tipoSelecao, setTipoSelecao] = useState<"origem" | "destino">("origem");

  useEffect(() => {
    fetch("/idiomas_pt.json")
        .then(res => res.json())
        .then(data => setIdiomas(data))
        .catch(() => console.error("Erro ao carregar idiomas"));
}, []);

  async function abrirModal(tipo: "origem" | "destino") {
    setTipoSelecao(tipo);
    setOpenModal(true);
    if (Object.keys(idiomas).length === 0) {
      const res = await fetch("/idiomas_pt.json");
      const data = await res.json();
      setIdiomas(data);
    }
  }

  function handleSelecionar(nome: string, codigo: string) {
  const idioma = { nome, codigo };

  if (tipoSelecao === "origem") {
    setIdiomaOrigem(idioma);
  } else {
    setIdiomaDestino(idioma);
  }
}

  return (
    <div className="flex flex-col items-center px-4 py-6">

      <div className="text-center mb-15">
        <h1 className={`text-3xl font-bold ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
          Bem vindo(a) ao
        </h1>
        <h2 className={`text-3xl font-bold ${darkMode ? "text-cyan-400" : "text-gray-500"}`}>
          Xenoglossia!
        </h2>
      </div>

      <div className="text-center mb-6">
         <p className={`text-2xl mb-1 ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
          Configure os idiomas 
        </p>
        <p className={`text-2xl mb-3 ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>de tradução</p>
       
        <div className="flex gap-3 justify-center mb-15">
          <button
            onClick={() => abrirModal("origem")}
            className={`h-8 w-25 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
          >
            {idiomaOrigem.nome}
          </button>

          <img src={darkMode ? "/typcn_arrow-up-outline-dark.png" : "/typcn_arrow-up-outline.png"} alt="seta" />

          <button
            onClick={() => abrirModal("destino")}
            className={`h-8 w-25 px-4 py-1 rounded-md text-sm border cursor-pointer border-black ${darkMode ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}
          >
            {idiomaDestino.nome}
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className={`text-2xl mb-1 ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
          Selecione o que você 
        </p>
        <p className={`text-2xl mb-4 ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
           deseja traduzir
        </p>
        <div className="flex justify-center gap-6">
          <Link to='/textoTraducao'><img src={darkMode ? "/Component 3-dark.png" : "/Component 3.png"} className="h-10" /></Link>
          <Link to='/imgTraducao'><img src={darkMode ? "/Component 2-dark.png" : "/Component 2.png"} className="h-10" /></Link>
          <Link to='/vozTraducao'><img src={darkMode ? "/Component 1-dark.png" : "/Component 1.png"} className="h-10" /></Link>
        </div>
      </div>


      <p className={`text-2xl text-center ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
        E veja a mágica 
      </p>
      <p className={`text-2xl text-center ${darkMode ? "text-cyan-500" : "text-gray-500"}`}>
         acontecer
      </p>

      {openModal && (
        <ModalIdiomas
          idiomas={idiomas}
          tipoSelecao={tipoSelecao}
          onSelecionar={handleSelecionar}
          onFechar={() => setOpenModal(false)}
        />
      )}
    </div>
  );
}

export default App;