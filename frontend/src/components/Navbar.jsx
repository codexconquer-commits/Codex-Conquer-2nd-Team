import {
  UsersRound,
  House,
  MessageCircle,
  Moon,
  Phone,
  Sun,
  User,
} from "lucide-react";
import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../context/Theme-Context.js";
import Logo from "../assets/download-removebg-preview.png";

const Navbar = () => {
  const { isDark, setIsDark } = useContext(AppContext);

  const navClass = ({ isActive }) =>
    `p-2 rounded-lg transition-all duration-300 transform
     ${
       isActive
         ? isDark
           ? "bg-white/20 text-blue-400 scale-110 shadow-lg"
           : "bg-blue-100 text-blue-600 scale-110 shadow-lg"
         : isDark
         ? "hover:bg-white/10 text-gray-300 hover:text-white hover:scale-105"
         : "hover:bg-gray-100 text-gray-600 hover:scale-105"
     }
     focus:outline-none focus:ring-2 focus:ring-blue-400/30`;

  return (
    <div className="relative font-regular">
      {/* Top Navbar */}
      <div
        className={`fixed top-0 left-0 w-full h-14 z-10
          flex items-center gap-4 px-6
          rounded-br-2xl shadow-md backdrop-blur-sm
          ${isDark ? "bg-black/80 text-white" : "bg-white/90 text-black"}
          transition-colors duration-300`}
      >
        <img src={Logo} alt="Convo Logo" className="w-8 h-8 object-contain" />
        <h3 className="font-bold text-lg tracking-wide">CONVO</h3>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-16
          py-6 flex flex-col justify-between
          ${isDark ? "bg-black/80 text-white" : "bg-white/90 text-black"}
          border-r border-white/10
          backdrop-blur-sm shadow-md
          transition-colors duration-300`}
      >
        <aside className="flex flex-col items-center gap-4">
          <NavLink to="/" className={navClass} aria-label="Home">
            <House size={20} />
          </NavLink>

          <NavLink to="/messages" className={navClass} aria-label="Messages">
            <MessageCircle size={20} />
          </NavLink>

          <NavLink to="/groups" className={navClass} aria-label="Groups">
            <UsersRound size={20} />
          </NavLink>

          <NavLink to="/calls" className={navClass} aria-label="Calls">
            <Phone size={20} />
          </NavLink>

          <NavLink to="/profile" className={navClass} aria-label="Profile">
            <User size={20} />
          </NavLink>
        </aside>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          className={`p-2 rounded-lg transition-all duration-300 transform
            ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}
            focus:outline-none focus:ring-2 focus:ring-blue-400/30
            hover:scale-110 active:scale-95 mx-auto`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
