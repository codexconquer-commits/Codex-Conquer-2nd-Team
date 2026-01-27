import {
  Lock,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/Theme-Context";

const AudioCall = ({
  open = true,
  onClose = () => {},
  callerName = "Aisha Patel",
  callerAvatar = "AP",
  isCalling = false,
  isConnected = false,
  isCallOpen
}) => {
  const { isDark } = useContext(AppContext);
  const [callTime, setCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });


  // ================= CALL TIMER =================
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setCallTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // ================= FORMAT TIME =================
  const formatCallTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  // ================= HANDLE DRAG =================
  const handleMouseDown = (e) => {
    if (e.target.closest("button")) return; // Don't drag if clicking buttons
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // ================= HANDLE CALL END =================
  const handleEndCall = () => {
    setCallTime(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsMinimized(false);
    onClose();
  };

  if (!open) return null;

  // ================= MINIMIZED VIEW =================
  if (isMinimized) {
    return (
      <div>
      {isCallOpen && (
      <div
        className={`fixed z-50 p-3 rounded-full shadow-lg cursor-move hover:shadow-xl transition-shadow
          ${
            isDark
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="text-white flex items-center gap-2 text-sm font-medium hover:opacity-90"
          title="Expand call"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs hidden sm:inline">{callerName}</span>
          <Maximize2 size={16} />
        </button>
      </div>
      )}
      </div>
    );
  }

  // ================= FULL VIEW =================
  return (
    <div>
      {isCallOpen && (
    <div
      className={` z-50 bottom-6 right-6 sm:bottom-8 sm:right-8 w-80 sm:w-96
        rounded-2xl shadow-2xl overflow-hidden flex flex-col
        ${isDark ? "bg-slate-900" : "bg-slate-800"}`}
      style={{
        transform: isDragging ? "scale(0.98)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.2s",
      }}
    >
      {/* ================= HEADER - DRAGGABLE ================= */}
      <div
        className={`flex-shrink-0 p-4 text-center border-b cursor-move user-select-none hover:opacity-80
          ${
            isDark
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-700 bg-slate-700/50"
          }`}
        onMouseDown={handleMouseDown}
      >
        {/* Caller Name */}
        <h3 className="text-lg font-bold text-white truncate mb-1">
          {callerName}
        </h3>

        {/* Call Status & Timer */}
        <div className="flex items-center justify-center gap-2 text-xs">
          <Lock size={12} className="text-green-400" />
          <span className="text-gray-400">
            {isCalling ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Calling...
              </span>
            ) : isConnected ? (
              <span className="font-mono">{formatCallTime(callTime)}</span>
            ) : (
              "Connecting..."
            )}
          </span>
        </div>
      </div>

      {/* ================= AVATAR SECTION ================= */}
      <div className="flex-shrink-0 px-4 py-4 flex items-center justify-between">
        {/* Small Avatar */}
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl
              ${
                isDark
                  ? "bg-gradient-to-br from-blue-600 to-blue-800"
                  : "bg-gradient-to-br from-blue-500 to-blue-700"
              }`}
          >
            {callerAvatar}
          </div>

          {/* Muted Badge */}
          {isMuted && (
            <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1.5 shadow-lg">
              <MicOff size={12} className="text-white" />
            </div>
          )}

          {/* Speaking Indicator */}
          {isConnected && !isMuted && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className={`p-2 rounded-lg transition-colors
            ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-600"}`}
          title="Minimize"
          aria-label="Minimize call"
        >
          <Minimize2 size={18} className="text-gray-300" />
        </button>

        {/* End Call Button (Quick) */}
        <button
          onClick={handleEndCall}
          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="End call"
          aria-label="End call"
        >
          <Phone size={18} />
        </button>
      </div>

      {/* ================= COMPACT CONTROLS ================= */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-center gap-2 border-t border-slate-700/50">
        {/* Mute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-lg transition-all
            ${
              isMuted
                ? isDark
                  ? "bg-red-500/20 text-red-400"
                  : "bg-red-500/30 text-red-300"
                : isDark
                ? "bg-slate-700 text-gray-300"
                : "bg-slate-600 text-gray-200"
            }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Speaker Button */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`p-2 rounded-lg transition-all
            ${
              isSpeakerOn
                ? isDark
                  ? "bg-slate-700 text-gray-300"
                  : "bg-slate-600 text-gray-200"
                : isDark
                ? "bg-orange-500/20 text-orange-400"
                : "bg-orange-500/30 text-orange-300"
            }`}
          title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
        >
          {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </div>
    )}
    </div>
  );
};

export default AudioCall;
