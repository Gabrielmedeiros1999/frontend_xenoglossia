import { useState, useRef, useCallback } from "react";

export function useProgressoSimulado() {
  const [progresso, setProgresso] = useState(0);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const iniciar = useCallback(() => {
    setProgresso(0);

    if (intervaloRef.current) clearInterval(intervaloRef.current);

    intervaloRef.current = setInterval(() => {
      setProgresso((atual) => {
        if (atual >= 90) return atual; // trava em 90% esperando o backend
        
        // desacelera conforme se aproxima do limite
        const incremento = atual < 50 ? 8 : atual < 75 ? 4 : 1;
        return Math.min(atual + incremento, 90);
      });
    }, 300);
  }, []);

  const concluir = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setProgresso(100);

    // some com a barra logo depois de completar
    setTimeout(() => setProgresso(0), 500);
  }, []);

  const cancelar = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setProgresso(0);
  }, []);

  return { progresso, iniciar, concluir, cancelar };
}