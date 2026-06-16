import { useTheme } from "./context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Perfil() {
   
   const [nome, setNome] = useState("");
   const [email, setEmail] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const { darkMode } = useTheme();
   const navigate = useNavigate();

   useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (usuarioSalvo) {
      const usuario = JSON.parse(usuarioSalvo);

      setNome(usuario.nome);
      setEmail(usuario.email);
    }
   }, []);

   const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);

    try {
     const token = localStorage.getItem("token");

     if (!token) {
        toast.error("Usuário não autenticado");
        navigate("/login");
        return;
     }

     if (!nome.trim() || !email.trim()) {
        toast.error("Preencha todos os campos");
        return;
     }

     const response = await fetch(
       `${API_URL}/auth/perfil`,
       {
         method: "PUT",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({
           nome: nome.trim(),
           email: email.trim(),
         }),
       }
     );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail);
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify(data)
    );

    toast.success("Perfil atualizado com sucesso!");

  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Erro ao atualizar perfil"
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
          Perfil
        </h2>
        </div>
        <form onSubmit={handleSalvar} className="flex flex-col gap-5 max-w-sm mx-auto w-full">
          <div>
           <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>Usuário</label>
           <input 
              type="text" 
              value={nome}
              placeholder="Digite seu nome de usuário" 
              onChange={(e) => setNome(e.target.value)}
              className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>
          <div className="mb-4">
            <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>E-mail</label>
          <input 
             type="email" 
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder="Digite o seu e-mail" 
             className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>
          <Link to='/alterarSenha'>
          <button className={`w-full cursor-pointer py-2 rounded-md mb-4 font-bold ${darkMode ? "bg-green-500 text-black" : "bg-blue-600 text-white"}`}>
            Alterar Senha
          </button>
          </Link>
          <button 
           type="submit" 
           disabled={isLoading}
           className={`mt-10  font-semibold py-3 rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? "bg-green-600 hover:bg-green-700 text-black": "bg-blue-600 hover:bg-blue-700 text-white"}`}
           >
            {isLoading ? "Salvando..." : "Salvar"}
           </button>
        </form>
      </div>
    )
}