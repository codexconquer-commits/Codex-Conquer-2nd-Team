import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function useVideoCall(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isCallerRef = useRef(false);

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [caller, setCaller] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  /* 🔻 LOW NETWORK VIDEO */
  const videoConstraints = {
    width: { ideal: 640, max: 640 },
    height: { ideal: 360, max: 360 },
    frameRate: { ideal: 15, max: 15 },
  };

  /* 🔗 ATTACH REMOTE VIDEO */
  const attachRemoteVideo = (stream) => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = stream;
    remoteVideoRef.current.play().catch(() => {});
  };

  /* 🧹 CLEANUP */
  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    localStreamRef.current = null;
    pcRef.current = null;
    isCallerRef.current = false;

    setIsCallConnected(false);
    setCaller(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  /* 📞 START VIDEO CALL (CALLER) */
  const startVideoCall = async (otherUser, remoteVideoElement) => {
    isCallerRef.current = true;
    remoteVideoRef.current = remoteVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: videoConstraints,
    });

    localStreamRef.current = stream;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => attachRemoteVideo(e.streams[0]);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("video-ice-candidate", {
          toUserId: otherUser._id,
          candidate: e.candidate,
        });
      }
    };

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    setCaller(otherUser);
    setIsCallOpen(true);

    socket.emit("call-user-video", {
      toUserId: otherUser._id,
      offer,
      fromUser: me,
    });

    return stream;
  };

  /* ✅ ACCEPT VIDEO CALL (CALLEE) */
  const acceptVideoCall = async (remoteVideoElement) => {
    if (!incomingCall) return;

    isCallerRef.current = false;
    remoteVideoRef.current = remoteVideoElement;

    const { offer, fromUser } = incomingCall;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: videoConstraints,
    });

    localStreamRef.current = stream;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => attachRemoteVideo(e.streams[0]);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("video-ice-candidate", {
          toUserId: fromUser._id,
          candidate: e.candidate,
        });
      }
    };

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("accept-video-call", {
      toUserId: fromUser._id,
      answer,
    });

    setIsCallConnected(true);
    setIsCallOpen(true);

    // 🔥 IMPORTANT: incomingCall LAST me clear
    setIncomingCall(null);

    return stream;
  };

  /* 🛑 END CALL */
  const endVideoCall = () => {
    socket.emit("end-video-call", { toUserId: caller?._id });
    cleanup();
    setIsCallOpen(false);
  };

  /* 🎛 CONTROLS */
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  };

  /* 🌐 SOCKET LISTENERS */
  useEffect(() => {
    socket.on("incoming-video-call", (data) => {
      setIncomingCall(data);
      setCaller(data.fromUser);
      setIsCallOpen(true);
    });

    socket.on("video-call-accepted", async ({ answer }) => {
      if (!isCallerRef.current) return;
      if (pcRef.current?.signalingState !== "have-local-offer") return;

      await pcRef.current.setRemoteDescription(answer);
      setIsCallConnected(true);
    });

    socket.on("video-ice-candidate", ({ candidate }) => {
      if (candidate && pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("video-call-ended", () => {
      cleanup();
      setIsCallOpen(false);
    });

    return () => socket.offAny();
  }, []);

  return {
    isCallOpen,
    isCallConnected,
    caller,
    incomingCall,
    isMuted,
    isCameraOff,
    remoteVideoRef,
    startVideoCall,
    acceptVideoCall,
    endVideoCall,
    toggleMute,
    toggleCamera,
  };
}
