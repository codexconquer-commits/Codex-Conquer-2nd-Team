import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

/* ================= RTC CONFIG ================= */
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ================= VIDEO CONSTRAINTS ================= */
const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  aspectRatio: 16 / 9,
  frameRate: { ideal: 30 },
  facingMode: "user",
};

export default function useVideoCall(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const peerUserRef = useRef(null);
  const isCallerRef = useRef(false);

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [caller, setCaller] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  /* ================= CLEANUP (🔥 MOST IMPORTANT) ================= */
  const cleanup = () => {
    try {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}

    try {
      pcRef.current?.getSenders().forEach(s => {
        try { pcRef.current.removeTrack(s); } catch {}
      });
      pcRef.current?.close();
    } catch {}

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
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

  /* ================= ATTACH REMOTE AUDIO ================= */
  const attachRemoteAudio = (stream) => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      audio.muted = false;
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }
    remoteAudioRef.current.srcObject = stream;
    remoteAudioRef.current.play().catch(() => {});
  };

  /* ================= REGISTER REMOTE VIDEO ================= */
  const registerRemoteElement = (el) => {
    remoteVideoRef.current = el;
  };

  /* ================= CREATE PEER ================= */
  const createPeer = (toUserId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      attachRemoteAudio(stream);
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
  if (pcRef.current) return; // 🔒 already in call

  peerUserRef.current = otherUser;
  isCallerRef.current = true;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: VIDEO_CONSTRAINTS,
  });

  localStreamRef.current = stream;

  const pc = createPeer(otherUser._id);
  pcRef.current = pc;

  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];

  if (audioTrack) pc.addTrack(audioTrack, stream);
  if (videoTrack) pc.addTrack(videoTrack, stream);

  console.log("📤 Caller sending", {
    audio: !!audioTrack,
    video: !!videoTrack,
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
  if (!incomingCall || pcRef.current) return;

  peerUserRef.current = incomingCall.fromUser;
  isCallerRef.current = false;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: VIDEO_CONSTRAINTS,
  });

  localStreamRef.current = stream;

  const pc = createPeer(incomingCall.fromUser._id);
  pcRef.current = pc;

  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];

  if (audioTrack) pc.addTrack(audioTrack, stream);
  if (videoTrack) pc.addTrack(videoTrack, stream);

  console.log("📥 Callee sending", {
    audio: !!audioTrack,
    video: !!videoTrack,
  });

  await pc.setRemoteDescription(incomingCall.offer);

  for (const c of pendingCandidatesRef.current) {
    await pc.addIceCandidate(new RTCIceCandidate(c));
  }
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

  /* ================= END / REJECT ================= */
  const endVideoCall = () => {
    if (peerUserRef.current) {
      socket.emit("end-video-call", {
        toUserId: peerUserRef.current._id,
      });
    }
    cleanup();
  };

  const rejectVideoCall = () => {
    if (incomingCall?.fromUser?._id) {
      socket.emit("reject-video-call", {
        toUserId: incomingCall.fromUser._id,
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

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    socket.on("incoming-video-call", (data) => {
      setIncomingCall(data);
      setCaller(data.fromUser);
      setIsCallOpen(true);
      setIsCallConnected(false);
    });

    socket.on("video-call-accepted", async ({ answer }) => {
      if (!isCallerRef.current || !pcRef.current) return;
      if (pcRef.current.signalingState !== "have-local-offer") return;

      await pcRef.current.setRemoteDescription(answer);

      for (const c of pendingCandidatesRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      }
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
    socket.on("video-call-rejected", cleanup);

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
    rejectVideoCall,
    endVideoCall,
    toggleMute,
    toggleCamera,
    registerRemoteElement,
    localStreamRef,
  };
}
