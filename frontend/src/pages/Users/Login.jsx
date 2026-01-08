import React, { useContext, useState } from "react";
import { Mail, Lock, EyeOff } from "lucide-react";
import { AppContext } from "../../context/Theme-Context.js";
import {Link} from 'react-router-dom'
import Axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const { isDark } = useContext(AppContext);

  const API_BASE = import.meta.env.VITE_BASE_URL || "";

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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f1b3d] to-[#0a1025] px-4">

    {/* Card */}
    <div className="w-full max-w-sm bg-gradient-to-b from-[#4facfe] to-[#5f2c82] rounded-3xl p-6 shadow-2xl">

      {/* Title */}
      <h1 className="text-white text-2xl font-semibold mb-6">
        Log in
      </h1>

      {/* Form */}
      <form onSubmit={submitHandler} className="space-y-4">

        {/* Email */}
        <div>
          <label className="text-white text-sm mb-1 block">
            E-mail Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl bg-white outline-none"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-white text-sm mb-1 block">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl bg-white outline-none"
          />
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-sm text-white">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Remember Me
          </label>
          <span className="cursor-pointer underline">
            Forgot Password?
          </span>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full mt-4 bg-[#0f1b3d] hover:bg-[#0c1633] text-white py-3 rounded-xl font-semibold transition"
        >
          Log in
        </button>
      </form>
    </div>

    {/* Footer */}
    <p className="absolute bottom-6 text-sm text-gray-300">
      Don’t Have An Account?{" "}
      <Link to="/signup" className="text-white font-semibold">
        Sign Up
      </Link>
    </p>

    <ToastContainer position="top-right" autoClose={3000} />
  </div>
);
};

export default Login;
