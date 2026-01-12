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
import { Link } from "react-router-dom";
import { AppContext } from "../context/Theme-Context.js";
import Logo from "../assets/download-removebg-preview.png"; // ✅ FIXED

const Navbar = () => {
  const { isDark, setIsDark } = useContext(AppContext);

  return (
    <div className="relative font-regular">
      {/* 🔝 Top Navbar */}
      <div
        className={`${
          isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
        }
        fixed top-0 left-0 w-full h-14 z-10
        flex items-center gap-4 px-6
        rounded-br-2xl shadow-md theme-animate`}
      >
        <img
          src={Logo}
          alt="logo"
          className="w-8 h-8 object-contain"
        />
        <h3 className="font-bold text-lg tracking-wide">CONVO</h3>
      </div>

      {/* ⬅️ Sidebar */}
      <div
        className={`${
          isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
        }
        fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-16
        py-6 flex flex-col justify-between
        shadow-md theme-animate`}
      >
        <aside className="flex flex-col items-center gap-6">
          <Link to="/" className="icon-hover p-2 rounded-xl">
            <House />
          </Link>

          <Link to="/messages" className="icon-hover p-2 rounded-xl">
            <MessageCircle />
          </Link>

          <Link to="/notifications" className="icon-hover p-2 rounded-xl">
            <Bell />
          </Link>

          <Link to="/calls" className="icon-hover p-2 rounded-xl">
            <Phone />
          </Link>

          <Link to="/profile" className="icon-hover p-2 rounded-xl">
            <User />
          </Link>
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
