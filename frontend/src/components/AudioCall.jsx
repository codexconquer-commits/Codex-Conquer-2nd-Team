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

import Draggable from "react-draggable";


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
  const nodeRef = useRef(null);
  const wasDragged = useRef(false);


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
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{
        x: window.innerWidth - 220,
        y: window.innerHeight - 100,
      }}
      onStart={() => {
        wasDragged.current = false;
      }}
      onDrag={() => {
        wasDragged.current = true;
      }}
    >
      <div
        ref={nodeRef}
        className="fixed z-[9999] cursor-move"
      >
        <button
          onClick={() => {
            if (!wasDragged.current) {
              setIsMinimized(false);
            }
          }}
          className="flex items-center gap-2
                     bg-green-600 text-white
                     px-4 py-2 rounded-full shadow-xl"
        >
          <Maximize2 />
          {callerName}
        </button>
      </div>
    </Draggable>
  );
}

  const mm = String(Math.floor(callTime / 60)).padStart(2, "0");
  const ss = String(callTime % 60).padStart(2, "0");

  {/* ================= FULLSCREEN POPUP ================= */}

 return (
  <div
    className="
      fixed inset-0 z-[9999]
      flex flex-col
      bg-gradient-to-b from-[#2c3e73] to-[#0b1437]
      md:from-[#2c3e73] md:to-[#0b1437]
    "
  >

    {/* ================= TOP BAR ================= */}
<div className="relative flex items-center px-4 py-3 text-white md:px-10 md:py-6">
      {/* Mobile: Minimize */}
      <button
        onClick={() => setIsMinimized(true)}
        className="md:hidden w-10 h-10 rounded-full bg-white/90 text-black
                  flex items-center justify-center"
        >
        <Minimize2 size={18} />
      </button>

      {/* Center title */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <h2 className="text-base md:text-lg font-semibold">
          {callerName}
        </h2>
        <div className="flex items-center justify-center gap-1 text-xs opacity-80">
          <span>🔒</span>
          <span>End-to-end encrypted</span>
        </div>
      </div>

      {/* Desktop: CONVO on right */}
      <div className="ml:auto hidden md:flex items-center  gap-2 font-bold text-lg">  
        <span className="text-xl">🟣</span>
        <span>CONVO</span>
      </div>
</div>


    {/* ================= CENTER CALL INFO ================= */}
    <div className="flex-1 flex flex-col items-center justify-center text-white">
  <div
    className="
      w-40 h-40 md:w-36 md:h-36
      rounded-3xl bg-blue-200
      flex items-center justify-center
      mb-6 md:mb-4
    "
  >
    <span className="text-7xl md:text-6xl text-blue-900">👤</span>
  </div>

  <h2 className="text-2xl md:text-3xl font-semibold">
    {callerName}
  </h2>

  <p className="mt-2 text-sm opacity-70">
    {isConnected ? `${mm}:${ss}` : "Calling..."}
  </p>
</div>



    {/* ================= BOTTOM CONTROLS ================= */}
<div className="pb-8 md:pb-12">
  {/* Mobile controls (pill) */}
  <div className="flex justify-center md:hidden">
    <div className="flex items-center gap-4 bg-[#0f1c4d]
                    px-6 py-4 rounded-full shadow-2xl">
      <button
        onClick={onMuteToggle}
        className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
      >
        {isMuted ? <MicOff /> : <Mic />}
      </button>

      <button
        onClick={onClose}
        className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white"
      >
        <Phone />
      </button>
    </div>
  </div>

  {/* Desktop controls (spread layout) */}
  <div className="hidden md:flex items-center justify-between px-20">
    {/* Left */}
    <div className="flex gap-4">
      <button
        onClick={() => setIsMinimized(true)}
        className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
      >
        <Minimize2 />
      </button>

      <button
        onClick={onMuteToggle}
        className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
      >
        {isMuted ? <MicOff /> : <Mic />}
      </button>
    </div>

    

    {/* Right */}
    <button
      onClick={onClose}
      className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white"
    >
      <Phone />
    </button>
  </div>
</div>


    {/* ================= INCOMING ACTIONS ================= */}
    {isIncoming && !isConnected && (
      <div className="flex justify-center gap-8 pb-8">
        <button
          onClick={onAccept}
          className="w-14 h-14 rounded-full bg-green-500
                     flex items-center justify-center text-white"
        >
          <Check />
        </button>

        <button
          onClick={onReject}
          className="w-14 h-14 rounded-full bg-red-500
                     flex items-center justify-center text-white"
        >
          <X />
        </button>
      </div>
    )}
  </div>
);


};

export default AudioCall;
