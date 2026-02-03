import { useContext, useEffect } from "react";
import { AppContext } from "../context/Theme-Context";
import { useCallTrigger } from "../context/CallTriggerContext";
import useAudioCall from "../pages/Users/messages/useAudioCall";
import useVideoCall from "../pages/Users/messages/useVideoCall";
import AudioCall from "./AudioCall";
import VideoCall from "./VideoCall";

const GlobalCallHandler = () => {
  const { user } = useContext(AppContext);


  const audio = useAudioCall(user);
  const video = useVideoCall(user);

  const { audioTargetRef, videoTargetRef } = useCallTrigger();

  useEffect(() => {
    audioTargetRef.current = audio.startAudioCall;
    videoTargetRef.current = video.startVideoCall;
  }, [audio.startAudioCall, video.startVideoCall]);
 useEffect(() => {
  console.log("📞 AUDIO STATE", {
    open: audio.isCallOpen,
    incoming: audio.incomingCall,
    connected: audio.isCallConnected,
  });
}, [audio.isCallOpen, audio.incomingCall, audio.isCallConnected]);

useEffect(() => {
  console.log("🎥 VIDEO STATE", {
    open: video.isCallOpen,
    incoming: video.incomingCall,
    connected: video.isCallConnected,
  });
}, [video.isCallOpen, video.incomingCall, video.isCallConnected]);

  if (!user) return null;



  return (
    <>
      <AudioCall
        open={audio.isCallOpen}
        isConnected={audio.isCallConnected}
        isIncoming={!!audio.incomingCall}
        callerName={audio.caller?.fullName || "User"}
        isMuted={audio.isMuted}
        onAccept={audio.acceptAudioCall}
        onReject={audio.rejectAudioCall}
        onClose={audio.endAudioCall}
        onMuteToggle={audio.toggleMute}
      />

      <VideoCall
        open={video.isCallOpen}
        isConnected={video.isCallConnected}
        isIncoming={!!video.incomingCall}
        callerName={video.caller?.fullName || "User"}
        isMuted={video.isMuted}
        isCameraOff={video.isCameraOff}
        localStream={video.localStreamRef?.current || null}
        registerRemoteElement={video.registerRemoteElement}
        onAccept={video.acceptVideoCall}
        onReject={video.rejectVideoCall}
        onEnd={video.endVideoCall}
        onMuteToggle={video.toggleMute}
        onCameraToggle={video.toggleCamera}
      />
    </>
  );
};

export default GlobalCallHandler;
