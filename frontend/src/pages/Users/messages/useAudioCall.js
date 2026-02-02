import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

/* ================= RTC CONFIG ================= */

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export default function useAudioCall(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
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
    audio.volume = 1;            // 🔥 FORCE FULL VOLUME
    audio.setAttribute("controls", ""); // 🔥 DEBUG / MOBILE WAKE
    document.body.appendChild(audio);
    remoteAudioRef.current = audio;
  }

  remoteAudioRef.current.srcObject = stream;

  // 🔥 HARD PLAY (mobile safe)
  setTimeout(() => {
    remoteAudioRef.current
      ?.play()
      .then(() => console.log("🔊 Remote audio playing"))
      .catch((e) => console.warn("🔇 Play blocked:", e));
  }, 0);
};

  /* ================= FLUSH ICE ================= */

  const flushPendingCandidates = async () => {
    if (!pcRef.current) return;

    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (e) {
        console.error("ICE add error", e);
      }
    }
    pendingCandidatesRef.current = [];
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
    pendingCandidatesRef.current = [];
    isCallerRef.current = false;

    setIsCallConnected(false);
    setCaller(null);
    setIncomingCall(null);
    setIsMuted(false);
  };

  /* ================= START CALL (CALLER) ================= */

  const startAudioCall = async (otherUser) => {
    isCallerRef.current = true;
    setIsCallOpen(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      console.log("🎧 Remote tracks:", e.streams[0].getAudioTracks());
      attachRemoteAudio(e.streams[0]);
    };

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

    pc.ontrack = (e) => {
      console.log("🎧 Remote tracks:", e.streams[0].getAudioTracks());
      attachRemoteAudio(e.streams[0]);
    };

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
    await flushPendingCandidates();

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

  /* ================= END / REJECT ================= */

  const rejectAudioCall = () => {
    if (!incomingCall) return;

    socket.emit("call-rejected", {
      toUserId: incomingCall.fromUser._id,
    });

    cleanup();
    setIsCallOpen(false);
  };

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
      if (!isCallerRef.current) return;
      if (!pcRef.current) return;

      await pcRef.current.setRemoteDescription(answer);
      await flushPendingCandidates();

      setIsCallConnected(true);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (!candidate) return;

      if (pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      } else {
        pendingCandidatesRef.current.push(candidate);
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
