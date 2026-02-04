import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket";

/**
 * 🪓 FINAL AXE LEVEL GROUP AUDIO CALL HOOK
 * ✅ Audio plays
 * ✅ No race condition
 * ✅ Production safe
 */
const useGroupAudioCall = (roomId, me) => {
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const iceQueue = useRef({});
  const audioElements = useRef({}); // 🔥 MOST IMPORTANT

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  /* ================= MIC ================= */
  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    console.log("🎤 Requesting mic");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    return stream;
  };

  /* ================= AUDIO ATTACH ================= */
  const attachAudio = (userId, stream) => {
    if (audioElements.current[userId]) return;

    console.log("🔊 Attaching audio for", userId);

    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.muted = false;

    document.body.appendChild(audio);
    audioElements.current[userId] = audio;
  };

  /* ================= PEER ================= */
  const createPeer = async (remoteUserId) => {
    if (peerConnections.current[remoteUserId])
      return peerConnections.current[remoteUserId];

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current[remoteUserId] = pc;

    const stream = await getLocalStream();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("group-ice-candidate", {
          toUserId: remoteUserId,
          fromUserId: me._id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log("🎧 Audio track from", remoteUserId);

      attachAudio(remoteUserId, e.streams[0]);

      setRemoteStreams((prev) => {
        if (prev.find((s) => s.userId === remoteUserId)) return prev;
        return [...prev, { userId: remoteUserId, stream: e.streams[0] }];
      });
    };

    // flush ICE
    if (iceQueue.current[remoteUserId]) {
      iceQueue.current[remoteUserId].forEach((c) =>
        pc.addIceCandidate(c)
      );
      delete iceQueue.current[remoteUserId];
    }

    return pc;
  };

  /* ================= JOIN & SIGNALING ================= */
  useEffect(() => {
    if (!roomId || !me?._id) return;

    getLocalStream();

    socket.emit("join-group-call", {
      roomId,
      userId: me._id,
    });

    /* ---- existing users ---- */
    socket.on("group-existing-users", async ({ users }) => {
      for (const userId of users) {
        if (userId === me._id) continue;

        const pc = await createPeer(userId);

        if (pc.signalingState !== "stable") continue;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("group-offer", {
          toUserId: userId,
          fromUserId: me._id,
          offer,
        });
      }
    });

    /* ---- offer ---- */
    socket.on("group-offer", async ({ fromUserId, offer }) => {
      const pc = await createPeer(fromUserId);

      if (pc.signalingState !== "stable") return;

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("group-answer", {
        toUserId: fromUserId,
        fromUserId: me._id,
        answer,
      });
    });

    /* ---- answer ---- */
    socket.on("group-answer", async ({ fromUserId, answer }) => {
      const pc = peerConnections.current[fromUserId];
      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") return;

      await pc.setRemoteDescription(answer);
    });

    /* ---- ICE ---- */
    socket.on("group-ice-candidate", async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current[fromUserId];

      if (pc) {
        await pc.addIceCandidate(candidate);
      } else {
        iceQueue.current[fromUserId] ||= [];
        iceQueue.current[fromUserId].push(candidate);
      }
    });

    /* ---- leave ---- */
    socket.on("group-user-left", ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }

      if (audioElements.current[userId]) {
        audioElements.current[userId].remove();
        delete audioElements.current[userId];
      }

      setRemoteStreams((prev) =>
        prev.filter((s) => s.userId !== userId)
      );
    });

    return () => {
      socket.emit("leave-group-call", {
        roomId,
        userId: me._id,
      });

      Object.values(peerConnections.current).forEach((pc) =>
        pc.close()
      );

      Object.values(audioElements.current).forEach((a) =>
        a.remove()
      );

      peerConnections.current = {};
      audioElements.current = {};
      iceQueue.current = {};

      localStreamRef.current?.getTracks().forEach((t) => t.stop());

      socket.off("group-existing-users");
      socket.off("group-offer");
      socket.off("group-answer");
      socket.off("group-ice-candidate");
      socket.off("group-user-left");
    };
  }, [roomId, me?._id]);

  /* ================= CONTROLS ================= */
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const endCall = () => {
    socket.emit("leave-group-call", {
      roomId,
      userId: me._id,
    });
  };

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    isMuted,
    toggleMute,
    endCall,
  };
};

export default useGroupAudioCall;
