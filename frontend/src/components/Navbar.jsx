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

const Navbar = () => {
  const { isDark, setIsDark } = useContext(AppContext);

  return (
    <div className="font-regular w-screen h-screen relative">
      {/* 🔝 Top Navbar */}
      <div
        className={`${
          isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
        }
        fixed top-0 left-0 w-full h-14 z-10
        flex items-center gap-5 px-6
        rounded-br-2xl shadow-md theme-animate`}
      >
        <div className="w-8 h-8">
          <img
            src="../../images/download-removebg-preview.png"
            alt="logo"
            className="w-full h-full object-contain"
          />
        </div>

        <h3 className="font-bold text-lg tracking-wide">CONVO</h3>
      </div>

      {/* ⬅️ Sidebar */}
      <div
        className={`${
          isDark ? "bg-darkmode text-white" : "bg-lightmode text-lightmode"
        }
        fixed top-14 left-0 h-[91%]
        p-4 flex flex-col justify-between
       theme-animate`}
      >
        <aside className="flex flex-col items-center gap-5 ">
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
        <div className="flex justify-center absolute bottom-5 left-0 w-full">
          {isDark ? (
            <Sun
              className="icon-hover   rounded-full"
              onClick={() => setIsDark(false)}
            />
          ) : (
            <Moon
              className="icon-hover  rounded-full"
              onClick={() => setIsDark(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
