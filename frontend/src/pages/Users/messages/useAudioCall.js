import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function useAudio(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const isCallerRef = useRef(false);

  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [caller, setCaller] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  /* ================= REMOTE AUDIO ================= */

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

    remoteAudioRef.current
      .play()
      .catch(() =>
        console.warn("🔇 Autoplay blocked (needs user interaction)")
      );
  };

  /* ================= CLEANUP ================= */

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }

    localStreamRef.current = null;
    pcRef.current = null;
    isCallerRef.current = false;

    setIsCallConnected(false);
    setCaller(null);
    setIncomingCall(null);
    setIsMuted(false);
  };

  /* ================= START CALL (CALLER) ================= */

  const startAudioCall = async (otherUser) => {
    setIsCallOpen(true);
    isCallerRef.current = true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => attachRemoteAudio(e.streams[0]);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
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

    socket.emit("call-user", {
      toUserId: otherUser._id,
      offer,
      fromUser: me,
    });
  };

  /* ================= ACCEPT CALL (CALLEE) ================= */

  const acceptAudioCall = async () => {
    if (!incomingCall) return;
    isCallerRef.current = false;

    const { offer, fromUser } = incomingCall;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => attachRemoteAudio(e.streams[0]);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          toUserId: fromUser._id,
          candidate: e.candidate,
        });
      }
    };

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("accept-call", {
      toUserId: fromUser._id,
      answer,
    });

    setIsCallConnected(true);
    setIncomingCall(null);
    setIsCallOpen(true);
  };

  /* ================= REJECT ================= */

  const rejectAudioCall = () => {
    if (!incomingCall) return;

    socket.emit("call-rejected", {
      toUserId: incomingCall.fromUser._id,
    });

    cleanup();
    setIsCallOpen(false);
  };

  /* ================= END CALL ================= */

  const endAudioCall = () => {
    socket.emit("end-call", { toUserId: caller?._id });
    cleanup();
    setIsCallOpen(false);
  };

  /* ================= MUTE ================= */

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  /* ================= SOCKET LISTENERS ================= */

  useEffect(() => {
    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
      setCaller(data.fromUser);
      setIsCallOpen(true);
    });

    socket.on("call-accepted", async ({ answer }) => {
      // ✅ ONLY CALLER handles answer
      if (!isCallerRef.current) return;

      if (pcRef.current?.signalingState !== "have-local-offer") return;

      await pcRef.current.setRemoteDescription(answer);
      setIsCallConnected(true);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate && pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("call-ended", () => {
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
    startAudioCall,
    acceptAudioCall,
    rejectAudioCall,
    endAudioCall,
    toggleMute,
  };
}
