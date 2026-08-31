import { useEffect, useState } from "react";

/**
 * Carrega o mapa de idiomas (/idiomas_pt.json) uma única vez.
 * Antes esse `fetch` + `useEffect` estava copiado em toda tela de tradução.
 */
export function useIdiomasDisponiveis() {
  const [idiomas, setIdiomas] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/idiomas_pt.json")
      .then((res) => res.json())
      .then((data) => setIdiomas(data))
      .catch(() => console.error("Erro ao carregar idiomas"));
  }, []);

  return idiomas;
}
