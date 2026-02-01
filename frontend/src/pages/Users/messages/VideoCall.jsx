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
  callerName,
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
  }, [localStream]);

  /* Register remote video */
  useEffect(() => {
    if (remoteVideoRef.current) {
      registerRemoteElement(remoteVideoRef.current);
    }
  }, [registerRemoteElement]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex flex-col items-center">
        <div className="text-lg font-semibold">{callerName}</div>
        <div className="text-sm opacity-70">
          {isIncoming && !isConnected && "Incoming video call"}
          {!isIncoming && !isConnected && "Calling…"}
          {isConnected && "Video call connected"}
        </div>
      </div>

      {/* ================= VIDEO AREA ================= */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />

        {/* Local Preview */}
        {localStream && (
          <div className="absolute bottom-24 right-4 sm:right-6 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden border border-white/20 bg-black shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          </div>
        )}
      </div>

      {/* ================= CONTROLS ================= */}
      <div
        className="flex items-center justify-center gap-6 py-5
                   bg-black/80 backdrop-blur-md
                   pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mic */}
        <button
          onClick={onMuteToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition
            ${isMuted ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        {/* Camera */}
        <button
          onClick={onCameraToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition
            ${isCameraOff ? "bg-red-600" : "bg-white/10 hover:bg-white/20"}`}
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </button>

        {/* Accept / Reject / End */}
        {isIncoming && !isConnected ? (
          <>
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition"
            >
              <PhoneIncoming />
            </button>

            <button
              onClick={onReject}
              className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
            >
              <PhoneOff />
            </button>
          </>
        ) : (
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
          >
            <PhoneOff size={26} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
