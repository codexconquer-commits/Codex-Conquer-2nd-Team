import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Mail, Lock, Key } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const DEMO_LOGO = "../../../images/download-removebg-preview.png";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_BASE_URL;

  const [email, setEmail] = useState("");
  const [newpassword, setNewpassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpTimer]);

  // Send OTP
  const otpGenerate = async () => {
    if (!email) return toast.error("Email required");
    setOtpTimer(120);

    try {
      await axios.post(`${API_BASE}/api/users/sendOtp`, { email });
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error("Failed to send OTP");
      setOtpTimer(0);
    }
  };

  // Reset Password
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newpassword)
      return toast.error("All fields required");

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/users/reset-password`, {
        email,
        otp,
        newpassword,
      });
      toast.success("Password reset successful");
      setTimeout(() => navigate("/users/login"), 1500);
    } catch (err) {
      toast.error("Invalid OTP or Email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-blue-500 to-blue-900">

      {/* LEFT PANEL (Same as Login) */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 to-blue-900 text-white p-10">
        <img
          src={DEMO_LOGO}
          alt="Logo"
          className="w-20 h-20 mb-4 rounded-full bg-white p-2 shadow-lg"
        />
        <h1 className="text-4xl font-extrabold mb-2">
          Reset Password
        </h1>
        <p className="text-blue-100 text-center max-w-xs font-medium mb-8">
          Securely reset your password using OTP verification.
        </p>
        <div className="w-64 h-64 bg-blue-800 bg-opacity-30 rounded-3xl flex items-center justify-center shadow-xl">
          <span className="text-6xl">🔑</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center bg-blue-50 h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl border border-blue-100">

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <img src={DEMO_LOGO} alt="Logo" className="w-10 h-10 mr-2" />
            <span className="text-2xl font-bold text-blue-700">Convo</span>
          </div>

          <h1 className="text-2xl font-bold text-blue-800 mb-1">
            Forget Password
          </h1>
          <p className="text-sm text-blue-500 mb-6">
            Verify OTP to reset your password
          </p>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-4">
              <label className="text-sm text-blue-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 py-2 rounded-md border border-blue-200 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* OTP */}
            <div className="mb-4 relative">
              <label className="text-sm text-blue-700">OTP</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full pl-10 pr-28 py-2 rounded-md border border-blue-200 bg-blue-50 outline-none"
                  placeholder="Enter OTP"
                />
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={otpGenerate}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-md disabled:bg-gray-300"
                >
                  {otpTimer > 0 ? `${otpTimer}s` : "Send OTP"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-6">
              <label className="text-sm text-blue-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input
                  type="password"
                  value={newpassword}
                  onChange={(e) => setNewpassword(e.target.value)}
                  className="w-full pl-10 py-2 rounded-md border border-blue-200 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold shadow"
            >
              {loading ? "Processing..." : "Reset Password"}
            </button>

            <p className="text-sm text-center mt-4 text-blue-600">
              Remember password?{" "}
              <Link to="/login" className="font-medium hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
};

export default ForgetPassword;
