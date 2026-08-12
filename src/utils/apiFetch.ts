import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sessão expirada");
    this.name = "SessaoExpiradaError";
  }
}

// Evita disparar o toast várias vezes se várias requisições
// falharem quase ao mesmo tempo (ex: histórico + tradução)
let avisoJaExibido = false;

function deslogar() {
  localStorage.removeItem("token");

  if (!avisoJaExibido) {
    avisoJaExibido = true;
    toast.error("Sessão expirada, faça login novamente");
  }

  if (window.location.pathname !== "/") {
    // pequeno delay pra dar tempo do usuário ver o toast
    // antes do redirect (window.location.href recarrega a página)
    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  }
}

type ApiFetchOptions = RequestInit & {
  /** false para chamadas que não precisam de token (ex: login) */
  autenticado?: boolean;
};


export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { autenticado = true, headers, ...rest } = options;
  const token = localStorage.getItem("token");

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  if (autenticado && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (response.status === 401) {
    deslogar();
    throw new SessaoExpiradaError();
  }

  return response;
}