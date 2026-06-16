import { useTheme } from "./context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {

   const [email, setEmail] = useState("");
   const [senha, setSenha] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const { darkMode } = useTheme();
   const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isLoading) return;

  setIsLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail);
    }

    localStorage.setItem(
      "token",
      data.access_token
    );

    const perfilResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
      Authorization: `Bearer ${data.access_token}`
      }
    });

    const usuario = await perfilResponse.json();

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    toast.success("Login realizado com sucesso!");

    setTimeout(() => {
    navigate("/");
    }, 1000);

  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Erro ao entrar"
    );
  } finally {
    setIsLoading(false);
  }
};

    return (
      <div className={`flex flex-col min-h-screen px-4 ${darkMode ? "bg-[#0F172A]" : "bg-gray-50"}`}>
        <header className="flex justify-between p-3 mb-10">
          <img src={darkMode ? "/icon-park-outline_left-dark.png": "/icon-park-outline_left.png" } 
               alt="Voltar"
               className="cursor-pointer"
               onClick={() => navigate(-1)}
           />
          <div className="flex">
          <img src="/Logo.png" className="h-10"/>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-black"}`}>Xenoglossia</h1>          
          </div>
        </header>
         <div className="text-center mb-15">
        <h2 className={`text-center text-3xl font-bold mb-10 ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>
          Entrar
        </h2>
        </div>
        <form className="flex flex-col gap-5 max-w-sm mx-auto w-full" onSubmit={handleLogin}>
          <div>
            <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>E-mail</label>
          <input 
             type="email" 
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder="Digite o seu e-mail" 
             className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>
          <div>
            <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>Senha</label>
          <input 
            type="password" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha" 
            className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
           <button type="button" className={`text-lg mt-2 font-bold mb-30 ${darkMode ? "text-[#22C55E]" : "text-[#2563EB]"}`}>Esqueceu a senha ?</button>
          </div>
          <button 
          type="submit"
          disabled={isLoading} 
          className={`mt-10  font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? "bg-green-600 hover:bg-green-700 text-black": "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
          <div className={`${darkMode ? "text-[#E2E8F0]": "text-[#0F172A]"}`}>
           <span>Não possui conta?</span>
           <Link to='/cadastro'>
            <button className={`ml-1 font-medium cursor-pointer ${darkMode ? "text-[#22C55E]" : "text-[#2563EB]"}`}>Cadastre-se</button>
           </Link>
          </div>
        </form>
      </div>
    )
}