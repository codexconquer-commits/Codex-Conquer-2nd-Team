import {
  Check,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  X,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/Theme-Context";

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
    const timer = setInterval(() => {
      setCallTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [open, isConnected]);

  useEffect(() => {
    if (!open) {
      setCallTime(0);
      setIsMinimized(false);
    }
  }, [open]);

  /* ================= RING / ENGAGE ================= */
  useEffect(() => {
    ringAudioRef.current?.pause();
    engageAudioRef.current?.pause();

    if (!open || isConnected) return;

    if (isIncoming) {
      ringAudioRef.current = new Audio("/sound/ringtone.mp3");
      ringAudioRef.current.loop = true;
      ringAudioRef.current.play().catch(() => {});
    } else {
      engageAudioRef.current = new Audio("/sound/engage.mp3");
      engageAudioRef.current.loop = true;
      engageAudioRef.current.play().catch(() => {});
    }

    return () => {
      ringAudioRef.current?.pause();
      engageAudioRef.current?.pause();
      ringAudioRef.current = null;
      engageAudioRef.current = null;
    };
  }, [open, isIncoming, isConnected]);

  if (!open) return null;

  /* ================= MINIMIZED VIEW ================= */
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[9999]
                   flex items-center gap-2
                   bg-green-600 text-white
                   px-4 py-2 rounded-full shadow-xl"
      >
        <Maximize2 />
        {callerName}
      </button>
    );
  }

  const mm = String(Math.floor(callTime / 60)).padStart(2, "0");
  const ss = String(callTime % 60).padStart(2, "0");

  /* ================= FULLSCREEN POPUP ================= */
  return (
    <div className="fixed inset-0 z-[9999]
                    flex items-center justify-center
                    bg-black/40 backdrop-blur-sm">

      <div
        className={`w-80 rounded-2xl p-4 shadow-2xl
        ${isDark ? "bg-gray-900 text-white" : "bg-white text-black"}`}
      >
        {/* HEADER */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{callerName}</h3>
          <p className="text-sm opacity-70">
            {isConnected
              ? `Connected • ${mm}:${ss}`
              : isIncoming
              ? "Incoming call…"
              : "Calling…"}
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setIsMinimized(true)}>
            <Minimize2 />
          </button>

          {!isIncoming && (
            <button
              onClick={onClose}
              className="bg-red-600 text-white p-3 rounded-full"
            >
              <Phone />
            </button>
          )}

          <button onClick={onMuteToggle}>
            {isMuted ? <MicOff /> : <Mic />}
          </button>
        </div>

        {/* INCOMING ACTIONS */}
        {isIncoming && !isConnected && (
          <div className="flex justify-center gap-6">
            <button
              onClick={onAccept}
              className="bg-green-600 p-3 rounded-full text-white"
            >
              <Check />
            </button>

            <button
              onClick={onReject}
              className="bg-red-600 p-3 rounded-full text-white"
            >
              <X />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCall;
