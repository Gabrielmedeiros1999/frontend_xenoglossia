import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Layout from './Layout'
import { ThemeProvider } from './context/ThemeContext'
import { IdiomaProvider } from "./context/IdiomaContext";
import { HistoricoProvider } from "./context/HistoricoContext";
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from "sonner";

import App from './App.tsx'
import TextoTraducao from './TextoTraducao.tsx'
import ImgTraducao from './ImgTraducao.tsx'
import VozTraducao from './VozTraducao.tsx'
import Login from './Login.tsx'
import Cadastro from './Cadastro.tsx'
import Perfil from './Perfil.tsx'
import AlterarSenha from './AlteraSenha.tsx'

const rotas = createBrowserRouter([
  {
    path:'/',
    element: <Layout />,
    children: [
      {index: true, element: <App />},
      { path: 'textoTraducao', element: <TextoTraducao />},
      { path: 'imgTraducao', element: <ImgTraducao/>},
      { path: 'vozTraducao', element: <VozTraducao/>},
    ],
  },
  {
   path: 'login', 
   element: <Login/>
  },
  {
   path: 'cadastro', 
   element: <Cadastro/>
  },
  {
   path: 'perfil', 
   element: <Perfil/>
  },
  {
   path: 'alterarSenha', 
   element: <AlterarSenha/>
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <ThemeProvider>
    <IdiomaProvider>
     <HistoricoProvider>
    <RouterProvider router={rotas} />
    <Toaster position="top-right" richColors closeButton />
     </HistoricoProvider>
    </IdiomaProvider>
   </ThemeProvider>
  </StrictMode>,
)
