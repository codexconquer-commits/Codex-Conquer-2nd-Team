import Axios from "axios";
import { Lock, Mail,User } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "../../context/Theme-Context.js";

import Logo from "../assets/download-removebg-preview.png";


const SignUp = () => {
  const API_BASE = import.meta.env.VITE_BASE_URL || "";
  const { isDark } = useContext(AppContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName:"",
    email: "",
    contact: "",
    password: "",
  });

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password || !formData.contact) {
      toast.error("All fields are required");
      return;
    }


    try {
      const res = await Axios.post(
        `${API_BASE}/api/users/register`,
        {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          contact: formData.contact,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success("Account created successfully 🎉");
      setTimeout(() => {
        navigate("/");
      }, 1200);

      console.log("Signup success:", res.data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Signup failed"
      );
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
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Convo</h1>
        <p className="text-blue-100 mb-8 text-center max-w-xs font-medium">
          Create your account to start chatting with audio & video calls.
        </p>
        <div className="w-64 h-64 bg-blue-800 bg-opacity-30 rounded-3xl flex items-center justify-center shadow-xl">
          <span className="text-6xl">💬</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center bg-blue-50">
        <div className="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl border border-blue-100">
          <div className="flex items-center justify-center mb-6">
            <img src={Logo} alt="Convo Logo" className="w-10 h-10 mr-2" />
            <span className="text-2xl font-bold text-blue-700">Convo</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-800 mb-1">
            Create Account
          </h1>
          <p className="text-sm text-blue-500 mb-6">
            Sign up to continue to Convo
          </p>

          {/* fullName */}
          <div className="mb-4">
            <label className="text-sm mb-1 block text-blue-700">
              Full Name
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
              />
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full pl-10 py-2 rounded-md border border-blue-200 text-blue-900 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
          </div>
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
          <div className="mb-4">
            <label className="text-sm mb-1 block text-blue-700">
              Contact
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
              />
              <input
                type="Number"
                placeholder="+91 12345 67890"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                className="w-full pl-10 py-2 rounded-md border border-blue-200 text-blue-900 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
          </div>

          {/*  Password */}
          <div className="mb-6">
            <label className="text-sm mb-1 block text-blue-700">
               Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full py-2 px-3 rounded-md border border-blue-200 text-blue-900 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
            />
          </div>

          <button
            onClick={submitHandler}
            className="w-full bg-blue-700 hover:bg-blue-800 transition text-white py-2 rounded-lg font-semibold mb-4 shadow"
          >
            Sign Up
          </button>

          <p className="text-sm text-center mt-2 text-blue-600">
            Already Have An Account?{" "}
            <Link
              to="/login"
              className="text-blue-700 font-medium hover:underline"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SignUp;
