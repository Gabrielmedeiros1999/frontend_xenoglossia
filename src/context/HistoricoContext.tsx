import { createContext, useContext, useState, useEffect, } from "react";
import type { ReactNode } from "react";
import { apiFetch, SessaoExpiradaError } from "../utils/apiFetch";

export type Traducao = {
  id: number;
  texto: string;
  traducao: string;
  origem: string;
  destino: string;
};

type HistoricoContextType = {
  historico: Traducao[];
  loading: boolean;
  carregarHistorico: () => Promise<void>;
  deletarTraducao: (id: number) => Promise<void>;
  apagarTodoHistorico: () => Promise<void>;
};

const HistoricoContext = createContext<HistoricoContextType | undefined>(undefined);

export function HistoricoProvider({ children }: { children: ReactNode }) {
  const [historico, setHistorico] = useState<Traducao[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarHistorico = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setHistorico([]);
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/historico");

      if (!response.ok) {
        console.error("Erro ao carregar histórico:", response.status);
        setHistorico([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistorico(data);
      } else if (Array.isArray(data?.historico)) {
        setHistorico(data.historico);
      } else {
        console.error("Resposta inesperada de /historico:", data);
        setHistorico([]);
      }
    } catch (err) {
      if (!(err instanceof SessaoExpiradaError)) {
        console.error(err);
      }
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  };

  const deletarTraducao = async (id: number) => {
    const response = await apiFetch(`/historico/${id}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Erro ao deletar");
    }

    await carregarHistorico();
  };

  const apagarTodoHistorico = async () => {
    const response = await apiFetch("/historico", { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Erro ao apagar histórico");
    }

    setHistorico([]);
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  return (
    <HistoricoContext.Provider
      value={{ historico, loading, carregarHistorico, deletarTraducao, apagarTodoHistorico }}
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