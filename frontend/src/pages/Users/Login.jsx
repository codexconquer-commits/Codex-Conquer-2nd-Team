import Axios from "axios";
import { Lock, Mail } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "../../context/Theme-Context.js";

const DEMO_LOGO = "../../../images/download-removebg-preview.png";

const Login = () => {
  const API_BASE = import.meta.env.VITE_BASE_URL || "";
  const { isDark } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and Password are required");
      return;
    }

    try {
      const res = await Axios.post(
        `${API_BASE}/api/users/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success("Login successful 🎉");
      setTimeout(() => {
        navigate("/");
      }, 1200);

      console.log("Login success:", res.data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Login failed"
      );
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-blue-500 to-blue-900">

      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 to-blue-900 text-white p-10">
        <img
          src={DEMO_LOGO}
          alt="Convo Logo"
          className="w-20 h-20 mb-4 rounded-full bg-white p-2 shadow-lg"
        />
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-blue-100 mb-8 text-center max-w-xs font-medium">
          Login to continue chatting with audio & video calls.
        </p>
        <div className="w-64 h-64 bg-blue-800 bg-opacity-30 rounded-3xl flex items-center justify-center shadow-xl">
          <span className="text-6xl">🔐</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center h-[100vh] justify-center  bg-blue-50">
        <div className="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl border border-blue-100">

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <img src={DEMO_LOGO} alt="Convo Logo" className="w-10 h-10 mr-2" />
            <span className="text-2xl font-bold text-blue-700">Convo</span>
          </div>

          <h1 className="text-2xl font-bold text-blue-800 mb-1">
            Login Account
          </h1>
          <p className="text-sm text-blue-500 mb-6">
            Sign in to continue to Convo
          </p>

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm mb-1 block text-blue-700">
              E-mail Address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 py-2 rounded-md border border-blue-200 text-blue-900 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-sm mb-1 block text-blue-700">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
              />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-10 py-2 rounded-md border border-blue-200 text-blue-900 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
          </div>

          <button
            onClick={submitHandler}
            className="w-full bg-blue-700 hover:bg-blue-800 transition text-white py-2 rounded-lg font-semibold mb-4 shadow"
          >
            Log In
          </button>

            {/* Forget PassLink Link */}
          <p className="text-sm text-center mt-2 text-red-600">
            {" "}
            <Link
              to="/forgetPassword"
              className="text-red-600 font-medium hover:underline"
            >
              Forget Password
            </Link>
          </p>

          {/* SignUp Link */}
          <p className="text-sm text-center mt-6 text-blue-600">
            Don’t Have An Account?{" "}
            <Link
              to="/signup"
              className="text-blue-700 font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
