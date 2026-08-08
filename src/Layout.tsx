import { Outlet } from "react-router-dom";
import Menu from "./components/Menu";
import { useState } from "react";
import { useTheme } from "./context/ThemeContext";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? "bg-[#0F172A] text-cyan-400" : "bg-gray-50 text-gray-800"} min-h-screen`}>
      
      {/* HEADER */}
      <header className="h-10 flex justify-between items-center pt-7 mb-5">
        <div className="flex items-center -ml-5">
        <img src="/Logo.png" className="h-13 -mr-7"/>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Xenoglossia</h1>
        </div>
        <img
          src={darkMode ? "/Menu-dark.png" : "/Menu.png"}
          className="h-6 cursor-pointer mr-5"
          onClick={() => setMenuOpen(true)}
        />
      </header>

      {/* MENU */}
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* PÁGINAS */}
      <Outlet />
    </div>
  );
}