import { Link } from "react-router-dom";

export type PaginaTraducao = "texto" | "imagem" | "voz";

interface ItemNav {
  pagina: PaginaTraducao;
  rota: string;
  icone: string;
  iconeSelecionado: string;
}

// "doc" nunca aparece com ícone "selecionado" nas telas atuais, por isso
// fica de fora da lista e é sempre renderizado como link simples.
const ITENS: ItemNav[] = [
  { pagina: "texto", rota: "/textoTraducao", icone: "Component 3", iconeSelecionado: "Component 3-select" },
  { pagina: "imagem", rota: "/imgTraducao", icone: "Component 2", iconeSelecionado: "Component 2-select" },
  { pagina: "voz", rota: "/vozTraducao", icone: "Component 1", iconeSelecionado: "Component 1-select" },
];

interface NavegacaoTraducaoProps {
  paginaAtual: PaginaTraducao;
  darkMode: boolean;
  className?: string;
}

/**
 * Barra de ícones (texto / imagem / voz / documento) no rodapé das telas de
 * tradução. A página atual aparece com o ícone "-select" e sem link; as
 * outras viram <Link>.
 */
export function NavegacaoTraducao({ paginaAtual, darkMode, className = "gap-6 mt-auto" }: NavegacaoTraducaoProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      {ITENS.map(({ pagina, rota, icone, iconeSelecionado }) => {
        const nomeArquivo = pagina === paginaAtual ? iconeSelecionado : icone;
        const src = darkMode ? `/${nomeArquivo}-dark.png` : `/${nomeArquivo}.png`;
        const img = <img src={src} className="h-10" alt="" />;

        return pagina === paginaAtual ? <span key={pagina}>{img}</span> : (
          <Link key={pagina} to={rota}>
            {img}
          </Link>
        );
      })}

      <Link to="/docTraducao">
        <img src={darkMode ? "/Component 19-dark.png" : "/Component 19.png"} className="h-10" alt="" />
      </Link>
    </div>
  );
}
