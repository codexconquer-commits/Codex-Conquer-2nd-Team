import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

/* ================= RTC CONFIG ================= */
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ================= VIDEO QUALITY (NO ZOOM, HD) ================= */
const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1280 },
  height: { ideal: 720, max: 720 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: "user", // 🔥 FRONT CAMERA (mobile zoom fix)
};

export default function useVideoCall(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const peerUserRef = useRef(null);
  const isCallerRef = useRef(false);

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [caller, setCaller] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  /* ================= REGISTER REMOTE VIDEO ================= */
  const registerRemoteElement = (el) => {
    remoteVideoRef.current = el;
  };

  /* ================= CLEANUP ================= */
  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    pcRef.current = null;
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    peerUserRef.current = null;
    isCallerRef.current = false;

    setIsCallOpen(false);
    setIsCallConnected(false);
    setIncomingCall(null);
    setCaller(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  /* ================= CREATE PEER ================= */
  const createPeer = (toUserId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("video-ice-candidate", {
          toUserId,
          candidate: e.candidate,
        });
      }
    };

    return pc;
  };

  /* ================= START VIDEO CALL ================= */
  const startVideoCall = async (otherUser) => {
    peerUserRef.current = otherUser;
    isCallerRef.current = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: VIDEO_CONSTRAINTS,
    });

    localStreamRef.current = stream;

    const pc = createPeer(otherUser._id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // 🔥 Quality boost
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    sender?.setParameters({
      encodings: [{ maxBitrate: 2_500_000 }],
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user-video", {
      toUserId: otherUser._id,
      offer,
      fromUser: me,
    });

    setCaller(otherUser);
    setIsCallOpen(true);

    return stream;
  };

  /* ================= ACCEPT VIDEO CALL ================= */
  const acceptVideoCall = async () => {
    if (!incomingCall) return;

    peerUserRef.current = incomingCall.fromUser;
    isCallerRef.current = false;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: VIDEO_CONSTRAINTS,
    });

    localStreamRef.current = stream;

    const pc = createPeer(incomingCall.fromUser._id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(incomingCall.offer);

    // 🔥 Apply queued ICE
    pendingCandidatesRef.current.forEach((c) =>
      pc.addIceCandidate(new RTCIceCandidate(c))
    );
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("accept-video-call", {
      toUserId: incomingCall.fromUser._id,
      answer,
    });

    setIsCallConnected(true);
    setIsCallOpen(true);
    setIncomingCall(null);

    return stream;
  };

  /* ================= END CALL ================= */
  const endVideoCall = () => {
    if (peerUserRef.current) {
      socket.emit("end-video-call", {
        toUserId: peerUserRef.current._id,
      });
    }
    cleanup();
  };

  /* ================= CONTROLS ================= */
  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setIsMuted(!t.enabled);
  };

  const toggleCamera = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setIsCameraOff(!t.enabled);
  };

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    socket.on("incoming-video-call", (data) => {
      setIncomingCall(data);
      setCaller(data.fromUser);
      setIsCallOpen(true);
    });

    socket.on("video-call-accepted", async ({ answer }) => {
      if (!isCallerRef.current || !pcRef.current) return;

      await pcRef.current.setRemoteDescription(answer);

      pendingCandidatesRef.current.forEach((c) =>
        pcRef.current.addIceCandidate(new RTCIceCandidate(c))
      );
      pendingCandidatesRef.current = [];

      setIsCallConnected(true);
    });

    socket.on("video-ice-candidate", ({ candidate }) => {
      if (!pcRef.current || !candidate) return;

      if (pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socket.on("video-call-ended", cleanup);

    return () => socket.offAny();
  }, []);

  return {
    isCallOpen,
    isCallConnected,
    caller,
    incomingCall,
    isMuted,
    isCameraOff,
    startVideoCall,
    acceptVideoCall,
    endVideoCall,
    toggleMute,
    toggleCamera,
    registerRemoteElement,
  };
}
