import {
  Check,
  Lock,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  X,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../context/Theme-Context";

const AudioCall = ({
  open,
  onClose,
  callerName = "Unknown",
  isMuted = false,
  onMuteToggle = () => {},
  onAccept = () => {},
  onReject = () => {},
  isIncoming = false,
  isConnected = false,
}) => {
  const { isDark } = useContext(AppContext);

  const [callTime, setCallTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const ringAudioRef = useRef(null);
  const engageAudioRef = useRef(null);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!open || !isConnected) return;
    const timer = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [open, isConnected]);

  useEffect(() => {
    if (!open) {
      setCallTime(0);
      setIsMinimized(false);
    }
  }, [open]);

  /* ================= RING / ENGAGE SOUND ================= */

  useEffect(() => {
    // 📲 Receiver hears ringtone
    if (open && isIncoming && !isConnected) {
      ringAudioRef.current = new Audio("/sound/ringtone.mp3");
      ringAudioRef.current.loop = true;
      ringAudioRef.current.volume = 0.7;
      ringAudioRef.current.play().catch(() => {});
    }

    return () => {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current.currentTime = 0;
        ringAudioRef.current = null;
      }
    };
  }, [open, isIncoming, isConnected]);

  useEffect(() => {
    // 📞 Caller hears engage / calling tone
    if (open && !isIncoming && !isConnected) {
      engageAudioRef.current = new Audio("/sound/engage.mp3");
      engageAudioRef.current.loop = true;
      engageAudioRef.current.volume = 0.6;
      engageAudioRef.current.play().catch(() => {});
    }

    return () => {
      if (engageAudioRef.current) {
        engageAudioRef.current.pause();
        engageAudioRef.current.currentTime = 0;
        engageAudioRef.current = null;
      }
    };
  }, [open, isIncoming, isConnected]);

  if (!open) return null;

  const format = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  const isRinging = open && !isConnected;

  /* ================= MINIMIZED ================= */
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2
        bg-gradient-to-r from-blue-600 to-indigo-600
        text-white px-4 py-2 rounded-full shadow-lg
        hover:scale-105 transition-all"
      >
        <Maximize2 size={16} />
        <span className="text-sm font-medium">{callerName}</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 overflow-hidden
      rounded-2xl shadow-2xl backdrop-blur
      ${isDark ? "bg-slate-900/95" : "bg-slate-800/95"}`}
    >
      {/* HEADER */}
      <div className="px-4 pt-5 pb-4 text-center">
        <div
          className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center
          rounded-full text-2xl font-bold text-white shadow-lg
          ${
            isRinging
              ? "bg-green-500 animate-pulse"
              : "bg-gradient-to-br from-blue-500 to-purple-600"
          }`}
        >
          {callerName?.[0]?.toUpperCase() || "U"}
        </div>

        <h3 className="text-base font-semibold text-white">{callerName}</h3>

        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-400">
          <Lock size={12} />
          {isConnected
            ? format(callTime)
            : isIncoming
            ? "Incoming call…"
            : "Calling…"}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setIsMinimized(true)}
          className="rounded-full p-2 text-gray-400
          hover:bg-white/10 hover:text-white transition"
        >
          <Minimize2 size={18} />
        </button>

        {(isConnected || (!isIncoming && !isConnected)) && (
          <button
            onClick={onClose}
            className="flex h-14 w-14 items-center justify-center
            rounded-full bg-red-500 text-white
            shadow-lg hover:bg-red-600 hover:scale-105 transition-all"
          >
            <Phone size={22} />
          </button>
        )}

        <button
          onClick={() => onMuteToggle(!isMuted)}
          className={`flex h-11 w-11 items-center justify-center rounded-full
          transition-all shadow
          ${
            isMuted
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {/* INCOMING ACTIONS */}
      {isIncoming && !isConnected && (
        <div className="flex justify-center gap-6 px-6 py-4 border-t border-white/10">
          <button
            onClick={onAccept}
            className="flex h-12 w-12 items-center justify-center
            rounded-full bg-green-500 text-white
            shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
          >
            <Check size={22} />
          </button>

          <button
            onClick={onReject}
            className="flex h-12 w-12 items-center justify-center
            rounded-full bg-red-500 text-white
            shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioCall;
