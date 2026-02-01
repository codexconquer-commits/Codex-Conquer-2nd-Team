import { useEffect, useRef, useState } from "react";
import socket from "../../../socket/socket";

/* ================= RTC CONFIG ================= */
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ================= DEFAULT VIDEO ================= */
const getVideoConstraints = (facingMode = "user") => ({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
  facingMode,
});

export default function useVideoCall(me) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerUserRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isCallerRef = useRef(false);
  const facingModeRef = useRef("user"); // user | environment

  /* ================= STATE ================= */
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [caller, setCaller] = useState(null);
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
    peerUserRef.current = null;
    pendingCandidatesRef.current = [];
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

  /* ================= GET MEDIA ================= */
  const getMediaStream = async () => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: getVideoConstraints(facingModeRef.current),
    });
  };

  /* ================= START CALL ================= */
  const startVideoCall = async (otherUser) => {
    peerUserRef.current = otherUser;
    isCallerRef.current = true;

    const stream = await getMediaStream();
    localStreamRef.current = stream;

    const pc = createPeer(otherUser._id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

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

  /* ================= ACCEPT CALL ================= */
  const acceptVideoCall = async () => {
    if (!incomingCall) return;

    peerUserRef.current = incomingCall.fromUser;
    isCallerRef.current = false;

    const stream = await getMediaStream();
    localStreamRef.current = stream;

    const pc = createPeer(incomingCall.fromUser._id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(incomingCall.offer);

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

    setIncomingCall(null);
    setIsCallConnected(true);
    setIsCallOpen(true);

    return stream;
  };

  /* ================= REJECT CALL ================= */
  const rejectVideoCall = () => {
    if (incomingCall?.fromUser?._id) {
      socket.emit("reject-video-call", {
        toUserId: incomingCall.fromUser._id,
      });
    }
    cleanup();
  };

  /* ================= END CALL ================= */
  const endVideoCall = () => {
    if (peerUserRef.current?._id) {
      socket.emit("end-video-call", {
        toUserId: peerUserRef.current._id,
      });
    }
    cleanup();
  };

  /* ================= TOGGLES ================= */
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

  /* ================= SWITCH CAMERA ================= */
  const switchCamera = async () => {
    if (!localStreamRef.current) return;

    facingModeRef.current =
      facingModeRef.current === "user" ? "environment" : "user";

    const newStream = await getMediaStream();
    const newVideoTrack = newStream.getVideoTracks()[0];

    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(newVideoTrack);
    }

    localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
    localStreamRef.current.removeTrack(
      localStreamRef.current.getVideoTracks()[0]
    );
    localStreamRef.current.addTrack(newVideoTrack);
  };

  /* ================= SOCKET EVENTS ================= */
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
      if (!candidate) return;

      if (pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socket.on("video-call-ended", cleanup);

    return () => socket.offAny();
  }, []);

  /* ================= EXPORT ================= */
  return {
    isCallOpen,
    isCallConnected,
    incomingCall,
    caller,
    isMuted,
    isCameraOff,
    startVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    endVideoCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    registerRemoteElement,
  };
}
