import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneIncoming,
} from "lucide-react";
import { useEffect, useRef } from "react";

const VideoCall = ({
  open,
  isConnected,
  callerName = "User",
  isIncoming,
  isMuted,
  isCameraOff,
  localStream,
  registerRemoteElement,
  onAccept,
  onReject,
  onEnd,
  onMuteToggle,
  onCameraToggle,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  /* Attach local stream */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  /* Register remote video */
  useEffect(() => {
    if (open && remoteVideoRef.current) {
      registerRemoteElement(remoteVideoRef.current);
    }
  }, [open, registerRemoteElement]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="absolute top-4 left-0 right-0 z-40 text-center pointer-events-none">
        <div className="text-lg font-semibold truncate">{callerName}</div>
        <div className="text-sm opacity-70">
          {isIncoming && !isConnected && "Incoming video call"}
          {!isIncoming && !isConnected && "Calling…"}
          {isConnected && "Connected"}
        </div>
      </div>

      {/* ================= VIDEO AREA ================= */}
      <div className="flex-1 relative bg-black pointer-events-none">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />

        {/* Local Preview (only after connected) */}
        {isConnected && localStream && (
          <div className="absolute bottom-28 right-4 z-30 w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border border-white/20 bg-black shadow-xl pointer-events-none">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* ================= CONTROLS ================= */}
      <div
        className="relative z-50 flex items-center justify-center gap-6 py-5
                   bg-black/80 backdrop-blur-md
                   pointer-events-auto
                   pb-[calc(env(safe-area-inset-bottom)+12px)]"
      >
        {/* Mute */}
        <button
          onClick={onMuteToggle}
          disabled={!isConnected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition
          ${isMuted ? "bg-red-600" : "bg-white/15 hover:bg-white/25"}
          ${!isConnected && "opacity-50"}`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        {/* Camera */}
        <button
          onClick={onCameraToggle}
          disabled={!isConnected}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition
          ${isCameraOff ? "bg-red-600" : "bg-white/15 hover:bg-white/25"}
          ${!isConnected && "opacity-50"}`}
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </button>

        {/* Accept / Reject / End */}
        {isIncoming && !isConnected ? (
          <>
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition"
            >
              <PhoneIncoming size={28} />
            </button>

            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
            >
              <PhoneOff size={28} />
            </button>
          </>
        ) : (
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
          >
            <PhoneOff size={28} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
