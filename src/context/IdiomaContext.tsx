import { createContext, useContext, useState, useEffect } from "react";

type Idioma = {
  nome: string;
  codigo: string;
};

type IdiomaContextType = {
  idiomaOrigem: Idioma;
  idiomaDestino: Idioma;
  setIdiomaOrigem: (idioma: Idioma) => void;
  setIdiomaDestino: (idioma: Idioma) => void;
};

const IdiomaContext = createContext<IdiomaContextType | undefined>(undefined);

export function IdiomaProvider({ children }: { children: React.ReactNode }) {
  const [idiomaOrigem, setIdiomaOrigemState] = useState<Idioma>({
    nome: "Inglês",
    codigo: "en",
  });

  const [idiomaDestino, setIdiomaDestinoState] = useState<Idioma>({
    nome: "Português",
    codigo: "pt",
  });

  // 🔄 carregar do localStorage
  useEffect(() => {
    const origemSalva = localStorage.getItem("idiomaOrigem");
    const destinoSalvo = localStorage.getItem("idiomaDestino");

    if (origemSalva) setIdiomaOrigemState(JSON.parse(origemSalva));
    if (destinoSalvo) setIdiomaDestinoState(JSON.parse(destinoSalvo));
  }, []);

  // 💾 salvar sempre que mudar
  function setIdiomaOrigem(idioma: Idioma) {
    setIdiomaOrigemState(idioma);
    localStorage.setItem("idiomaOrigem", JSON.stringify(idioma));
  }

  function setIdiomaDestino(idioma: Idioma) {
    setIdiomaDestinoState(idioma);
    localStorage.setItem("idiomaDestino", JSON.stringify(idioma));
  }

  return (
    <IdiomaContext.Provider
      value={{
        idiomaOrigem,
        idiomaDestino,
        setIdiomaOrigem,
        setIdiomaDestino,
      }}
    >
      {children}
    </IdiomaContext.Provider>
  );
}

// hook customizado
export function useIdioma() {
  const context = useContext(IdiomaContext);
  if (!context) {
    throw new Error("useIdioma deve ser usado dentro de IdiomaProvider");
  }
  return context;
}