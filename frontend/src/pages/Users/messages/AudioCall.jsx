import { Lock, Maximize2, Mic, MicOff, Minimize2, Phone } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/Theme-Context";

const AudioCall = ({
  open,
  onClose,
  callerName = "Unknown",
  isMuted = false,
  onToggleMute = () => {},
}) => {
  const { isDark } = useContext(AppContext);

  const [callTime, setCallTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const format = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full"
      >
        <Maximize2 size={16} /> {callerName}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-80 rounded-xl shadow-xl z-50
        ${isDark ? "bg-slate-900" : "bg-slate-800"}`}
    >
      <div className="p-4 text-center border-b border-white/10">
        <h3 className="font-bold text-white">{callerName}</h3>
        <div className="text-xs text-gray-400 flex justify-center gap-1">
          <Lock size={12} /> {format(callTime)}
        </div>
      </div>

      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <Minimize2 />
        </button>

        <button
          onClick={onClose}
          className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors"
        >
          <Phone />
        </button>

        <button
          onClick={() => onToggleMute(!isMuted)}
          className={`p-3 rounded-full transition-all ${
            isMuted
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>
    </div>
  );
};

export default AudioCall;
