import {
  Lock,
  Mic,
  MicOff,
  Phone,
  Users,
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
}) => {
  const { isDark } = useContext(AppContext);
  const [callTime, setCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isPulsing, setIsPulsing] = useState(true);

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

  // ================= HANDLE CALL END =================
  const handleEndCall = () => {
    setCallTime(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="  inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* ================= BACKDROP ================= */}
      <div
        className={`absolute inset-0 backdrop-blur-md w-[100vw] transition-all duration-300
          ${isDark ? "bg-black/60" : "bg-black/70"}`}
        onClick={handleEndCall}
        aria-hidden="true"
      />

      {/* ================= AUDIO CALL MODAL ================= */}
      <div
        className={`relative w-full sm:max-w-md md:max-w-lg h-screen sm:h-auto sm:max-h-[90vh]
          rounded-0 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col
          ${isDark ? "bg-slate-900" : "bg-slate-800"}`}
      >
        {/* ================= HEADER SECTION ================= */}
        <div className="flex-shrink-0 pt-8 sm:pt-10 pb-6 text-center ">
          {/* Caller Name */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {callerName}
          </h2>

          {/* Call Status */}
          <div className="flex items-center justify-center gap-1.5 mb-4 opacity-80">
            <Lock size={14} className="text-green-400" />
            <span className="text-xs sm:text-sm text-gray-300">
              End-to-end encrypted
            </span>
          </div>

          {/* Call Timer */}
          <div className="text-base sm:text-lg font-mono text-gray-400">
            {isCalling ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Calling...
              </span>
            ) : isConnected ? (
              formatCallTime(callTime)
            ) : (
              "Connecting..."
            )}
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Avatar Container with Pulse Animation */}
          <div className="relative mb-8">
            {/* Pulse Ring Animation */}
            {isConnected && isPulsing && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-ping"
                  style={{ animationDuration: "1.5s" }}
                />
              </>
            )}

            {/* Avatar Circle */}
            <div
              className={`relative w-24 sm:w-32 md:w-40 h-24 sm:h-32 md:h-40
                rounded-full flex items-center justify-center font-bold text-white
                transition-all duration-300
                ${
                  isDark
                    ? "bg-gradient-to-br from-blue-600 to-blue-800"
                    : "bg-gradient-to-br from-blue-500 to-blue-700"
                }`}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl">
                {callerAvatar}
              </span>

              {/* Muted Indicator Overlay */}
              {isMuted && (
                <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-2 sm:p-3 shadow-lg">
                  <MicOff size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Speaking Indicator */}
          {isConnected && !isMuted && (
            <div className="flex items-center gap-2 opacity-70">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      height: `${12 + i * 4}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">Speaking</span>
            </div>
          )}
        </div>

        {/* ================= CONTROLS SECTION ================= */}
        <div className="flex-shrink-0 px-6 py-6 sm:py-8">
          {/* Control Bar Background */}
          <div
            className={`flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl
              ${
                isDark ? "bg-slate-800/50" : "bg-slate-700/50"
              } backdrop-blur-sm border
              ${isDark ? "border-slate-700/50" : "border-slate-600/50"}`}
          >
            {/* Mute / Unmute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`group p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                ${
                  isMuted
                    ? isDark
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-red-500/30 text-red-300 hover:bg-red-500/40"
                    : isDark
                    ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    : "bg-slate-600 text-gray-200 hover:bg-slate-500"
                }`}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? (
                <MicOff size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <Mic size={20} className="sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Speaker On / Off Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`group p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                ${
                  isSpeakerOn
                    ? isDark
                      ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      : "bg-slate-600 text-gray-200 hover:bg-slate-500"
                    : isDark
                    ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                    : "bg-orange-500/30 text-orange-300 hover:bg-orange-500/40"
                }`}
              title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
              aria-label={isSpeakerOn ? "Speaker on" : "Speaker off"}
            >
              {isSpeakerOn ? (
                <Volume2 size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <VolumeX size={20} className="sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Add Participant Button (Optional) */}
            <button
              className={`group p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                ${
                  isDark
                    ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    : "bg-slate-600 text-gray-200 hover:bg-slate-500"
                }`}
              title="Add participant"
              aria-label="Add participant"
            >
              <Users size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className={`group p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/50`}
              title="End call"
              aria-label="End call"
            >
              <Phone size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCall;
