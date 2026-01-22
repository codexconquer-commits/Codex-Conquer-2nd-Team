import Axios from "axios";
import { Lock, Mail } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "../../context/Theme-Context.js";

import Logo from "../../assets/download-removebg-preview.png";

const Login = () => {
  const API_BASE = import.meta.env.VITE_BASE_URL || "";
  const { isDark } = useContext(AppContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    return newErrors;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix all errors");
      return;
    }

    setIsLoading(true);
    try {
      const res = await Axios.post(`${API_BASE}/api/users/login`, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      localStorage.setItem("token", res.data.token);
      toast.success("Login successful 🎉");
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-blue-500 to-blue-900">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 to-blue-900 text-white p-10">
        <img
          src={Logo}
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

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center min-h-screen md:min-h-auto bg-blue-50 px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 shadow-2xl border border-blue-100">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <img src={Logo} alt="Convo Logo" className="w-10 h-10 mr-2" />
            <span className="text-2xl font-bold text-blue-700">Convo</span>
          </div>

          <h1 className="text-2xl font-bold text-blue-800 mb-1">
            Login Account
          </h1>
          <p className="text-sm text-blue-500 mb-6">
            Sign in to continue to Convo
          </p>

          <form onSubmit={submitHandler} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-2 block text-blue-700">
                Email Address
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
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  aria-label="Email Address"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-300
                    ${
                      errors.email
                        ? "border-red-500 bg-red-50 focus:ring-red-400"
                        : "border-blue-200 bg-blue-50 focus:ring-blue-400"
                    }
                    outline-none focus:ring-2 focus:border-transparent`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium mb-2 block text-blue-700">
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
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  aria-label="Password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-300
                    ${
                      errors.password
                        ? "border-red-500 bg-red-50 focus:ring-red-400"
                        : "border-blue-200 bg-blue-50 focus:ring-blue-400"
                    }
                    outline-none focus:ring-2 focus:border-transparent`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-300 mt-6
                ${
                  isLoading
                    ? "bg-blue-400 text-white cursor-not-allowed opacity-70"
                    : "bg-blue-700 hover:bg-blue-800 text-white active:scale-95"
                }
                shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Links */}
          <div className="space-y-2 mt-4 text-sm text-center">
            <p className="text-red-600">
              <Link
                to="/forgetPassword"
                className="font-medium hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </p>
            <p className="text-blue-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-700 font-medium hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
