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
      <header className="flex justify-between p-4">
        <div className="flex">
        <img src="/Logo.png" className="h-8"/>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Xenoglossia</h1>
        </div>
        <img
          src={darkMode ? "/Menu-dark.png" : "/Menu.png"}
          className="h-6 cursor-pointer"
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