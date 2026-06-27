import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type { ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export type Traducao = {
  id: number;
  texto: string;
  traducao: string;
  origem: string;
  destino: string;
};

type HistoricoContextType = {
  historico: Traducao[];
  carregarHistorico: () => Promise<void>;
  deletarTraducao: (id: number) => Promise<void>;
};

const HistoricoContext = createContext<
  HistoricoContextType | undefined
>(undefined);

export function HistoricoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [historico, setHistorico] = useState<Traducao[]>([]);

  const carregarHistorico = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setHistorico([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/historico`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setHistorico(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deletarTraducao = async (id: number) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/historico/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Erro ao deletar");
    }

    await carregarHistorico();
};

  useEffect(() => {
    carregarHistorico();
  }, []);

  return (
    <HistoricoContext.Provider
      value={{
        historico,
        carregarHistorico,
        deletarTraducao,
      }}
    >
      {children}
    </HistoricoContext.Provider>
  );
}

export function useHistorico() {
  const context = useContext(HistoricoContext);

  if (!context) {
    throw new Error("useHistorico deve ser usado dentro do Provider");
  }

  return context;
}