import { useTheme } from "./context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function AlterarSenha() {
   
   const [senhaAtual, setSenhaAtual] = useState("");
   const [novaSenha, setNovaSenha] = useState("");
   const [confirmarSenha, setConfirmarSenha] = useState("");    
   const [isLoading, setIsLoading] = useState(false);
   
   const { darkMode } = useTheme();
   const navigate = useNavigate();

   const validarSenha = (senha: string) => {
      if (senha.length < 8) {
       return "A senha deve ter pelo menos 8 caracteres";
      }

      if (senha.length > 64) {
       return "A senha deve ter no máximo 64 caracteres";
      }

      if (!/[A-Z]/.test(senha)) {
        return "A senha deve conter pelo menos uma letra maiúscula";
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
       return "A senha deve conter pelo menos um caractere especial";
      }

    return null;
  };

const handleAlterarSenha = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isLoading) return;

  if (novaSenha !== confirmarSenha) {
    toast.error("As senhas não coincidem");
    return;
  }

  const erroSenha = validarSenha(novaSenha);

  if (erroSenha) {
    toast.error(erroSenha);
    return;
  }

  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/auth/alterar-senha`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail);
    }

    toast.success("Senha alterada com sucesso!");

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");

    setTimeout(() => {
      navigate("/");
    }, 1000);

  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Erro ao alterar senha"
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
          Altera Senha
        </h2>
        </div>
        <form onSubmit={handleAlterarSenha} className="flex flex-col gap-5 max-w-sm mx-auto w-full">
          <div className="mb-4">
            <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>Senha Atual</label>
          <input 
             type="password" 
             value={senhaAtual}
             onChange={(e) => setSenhaAtual(e.target.value)}
             placeholder="Digite sua senha atual" 
             className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>       
          <div>
            <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>Nova Senha</label>
          <input 
             type="password" 
             value={novaSenha}
             onChange={(e) => setNovaSenha(e.target.value)}
             placeholder="Digite sua nova senha" 
             className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>       
          <div>
           <label className={`text-3xl font-bold ${darkMode ? "text-[#E2E8F0]" : "text-[#0F172A]"}`}>Confirme sua senha</label>
           <input 
              type="password" 
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Confirme sua senha" 
              className={`w-full rounded-lg border px-4 py-2 outline-none ${darkMode ? "border-white text-[#06B6D4]": "border-black"}`} />
          </div>
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