import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
    audio.autoplay = false; // 🔥 important
    audio.playsInline = true;
    audio.muted = false;

    // mobile safe (NOT display:none)
    audio.style.position = "fixed";
    audio.style.top = "-1000px";
    audio.style.left = "-1000px";

    document.body.appendChild(audio);
    remoteAudioRef.current = audio;
  }

  remoteAudioRef.current.srcObject = stream;
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
    if (!otherUser || !me) return;

    isCallerRef.current = true;
    setCaller(otherUser);

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

  const { offer, fromUser } = incomingCall;
  isCallerRef.current = false;
  setCaller(fromUser);

  // 🎤 Get mic access (user gesture = Accept button)
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStreamRef.current = stream;

  const pc = new RTCPeerConnection(RTC_CONFIG);
  pcRef.current = pc;

  pc.ontrack = (e) => {
    attachRemoteAudio(e.streams[0]);

    // 🔥 MOBILE FIX: play audio inside user gesture context
    setTimeout(() => {
      remoteAudioRef.current?.play().catch(() => {});
    }, 0);
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

  // apply queued ICE
  pendingCandidatesRef.current.forEach((c) =>
    pc.addIceCandidate(c)
  );
  pendingCandidatesRef.current = [];

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("accept-call", {
    toUserId: fromUser._id,
    answer,
  });

  setIsCallConnected(true);
  setIncomingCall(null);
  setIsCallOpen(true);

  // 🔥 EXTRA SAFETY (some phones need this)
  setTimeout(() => {
    remoteAudioRef.current?.play().catch(() => {});
  }, 200);
};


  /* ================= REJECT CALL ================= */
  const rejectAudioCall = () => {
    if (!incomingCall?.fromUser?._id) return;

    socket.emit("reject-call", {
      toUserId: incomingCall.fromUser._id,
    });

    cleanup();
    setIsCallOpen(false);
  };

  /* ================= END CALL ================= */
  const endAudioCall = () => {
    if (caller?._id) {
      socket.emit("end-call", { toUserId: caller._id });
    }
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
    const onIncoming = (data) => {
      setIncomingCall(data);
      setCaller(data.fromUser);
      setIsCallOpen(true);
    };

    const onAccepted = async ({ answer }) => {
      if (!isCallerRef.current || !pcRef.current) return;
      if (pcRef.current.signalingState !== "have-local-offer") return;

      await pcRef.current.setRemoteDescription(answer);
      setIsCallConnected(true);
    };

    const onIce = ({ candidate }) => {
      if (!candidate || !pcRef.current) return;

      if (pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const onEnded = () => {
      cleanup();
      setIsCallOpen(false);
    };

    socket.on("incoming-call", onIncoming);
    socket.on("call-accepted", onAccepted);
    socket.on("ice-candidate", onIce);
    socket.on("call-ended", onEnded);
    socket.on("call-rejected", onEnded);

    return () => {
      socket.off("incoming-call", onIncoming);
      socket.off("call-accepted", onAccepted);
      socket.off("ice-candidate", onIce);
      socket.off("call-ended", onEnded);
      socket.off("call-rejected", onEnded);
    };
  }, []);

  /* ================= EXPORT ================= */
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
