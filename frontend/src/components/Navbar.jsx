import {
  Bell,
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

  // 🔹 Common class for nav icons
  const navClass = ({ isActive }) =>
    `p-2 rounded-xl transition-all
     ${
       isActive
         ? isDark
           ? "bg-white/20 text-blue-400 scale-110 theme-animate"
           : "bg-blue-100 text-blue-600 scale-110 theme-animate"
         : "icon-hover"
     }`;

  return (
    <div className="relative font-regular">
      {/* 🔝 Top Navbar */}
      <div
        className={`
          fixed top-0 left-0 w-full h-14 z-10
          flex items-center gap-4 px-6
          rounded-br-2xl shadow-md
          ${isDark ? "bg-black text-white theme-animate"  : "bg-white text-black theme-animate"}
        `}
      >
        <img src={Logo} alt="logo" className="w-8 h-8 object-contain" />
        <h3 className="font-bold text-lg tracking-wide">CONVO</h3>
      </div>

      {/* ⬅️ Sidebar */}
      <div
        className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-16
          py-6 flex flex-col justify-between shadow-md
          ${isDark ? "bg-black text-white" : "bg-white text-black"}
        `}
      >
        <aside className="flex flex-col items-center gap-6">
          <NavLink to="/" className={navClass}>
            <House />
          </NavLink>

          <NavLink to="/messages" className={navClass}>
            <MessageCircle />
          </NavLink>

          <NavLink to="/notifications" className={navClass}>
            <Bell />
          </NavLink>

          <NavLink to="/calls" className={navClass}>
            <Phone />
          </NavLink>

          <NavLink to="/profile" className={navClass}>
            <User />
          </NavLink>
        </aside>

        {/* 🌙 Theme Toggle */}
        <div className="flex justify-center">
          {isDark ? (
            <button
              onClick={() => setIsDark(false)}
              className="icon-hover p-2 rounded-full"
            >
              <Sun />
            </button>
          ) : (
            <button
              onClick={() => setIsDark(true)}
              className="icon-hover p-2 rounded-full"
            >
              <Moon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
