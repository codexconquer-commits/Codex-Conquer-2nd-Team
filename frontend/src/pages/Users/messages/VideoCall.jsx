import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useRef, useEffect } from "react";

const VideoCall = ({
  open,
  isConnected,
  callerName,
  isIncoming,
  isMuted,
  isCameraOff,
  onAccept,
  onReject,
  onEnd,
  onMuteToggle,
  onCameraToggle,
  localStream,
  remoteVideoRef,
}) => {
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Local Preview */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute bottom-24 right-6 w-36 h-48 rounded-xl border border-white"
      />

      {/* Caller Info */}
      <div className="absolute top-6 w-full text-center text-white">
        <h2 className="text-lg font-semibold">{callerName}</h2>
        <p className="opacity-80">
          {isConnected
            ? "Connected"
            : isIncoming
            ? "Incoming Video Call…"
            : "Calling…"}
        </p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 w-full flex justify-center gap-4">
        <button
          onClick={onMuteToggle}
          className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        <button
          onClick={onCameraToggle}
          className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white"
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </button>

        {/* ✅ ACCEPT BUTTON (FIXED) */}
        {isIncoming && !isConnected && (
          <button
            onClick={onAccept}
            className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white"
          >
            <Video />
          </button>
        )}

        {/* End / Reject */}
        <button
          onClick={isConnected ? onEnd : onReject}
          className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
