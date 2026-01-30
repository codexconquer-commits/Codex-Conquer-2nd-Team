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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      registerRemoteElement(remoteVideoRef.current);
    }
  }, [registerRemoteElement]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-4 right-4 w-40 h-28 rounded-xl border"
        />
      </div>

      <div className="flex justify-center gap-4 py-4">
        <button onClick={onMuteToggle}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={onCameraToggle}>
          {isCameraOff ? <VideoOff /> : <Video />}
        </button>

        {isIncoming && !isConnected ? (
          <>
            <button onClick={onAccept} className="bg-green-600 px-4 py-2">
              Accept
            </button>
            <button onClick={onReject} className="bg-red-600 px-4 py-2">
              Reject
            </button>
          </>
        ) : (
          <button onClick={onEnd} className="bg-red-600 px-4 py-2">
            <PhoneOff />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
