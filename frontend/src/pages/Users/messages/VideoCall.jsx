import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
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

  /* Register remote video element */
  useEffect(() => {
    if (remoteVideoRef.current) {
      registerRemoteElement(remoteVideoRef.current);
    }
  }, [registerRemoteElement]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* ================= VIDEO AREA ================= */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* Remote Video */}
        <div className="w-full h-full max-w-screen-lg aspect-video bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        </div>

        {/* Local Preview */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden border border-white/20 bg-black shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div
        className="flex items-center justify-center gap-5 py-4
                   bg-black/80 backdrop-blur-md
                   pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mute */}
        <button
          onClick={onMuteToggle}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>

        {/* Camera */}
        <button
          onClick={onCameraToggle}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </button>

        {/* Accept / Reject / End */}
        {isIncoming && !isConnected ? (
          <>
            <button
              onClick={onAccept}
              className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 transition"
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition"
            >
              Reject
            </button>
          </>
        ) : (
          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition"
          >
            <PhoneOff />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
