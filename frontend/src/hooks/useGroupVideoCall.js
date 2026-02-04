import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket";

/**
 * Group Audio Call Hook
 * @param {string} roomId - groupId
 * @param {object} me - logged in user
 */
const useGroupAudioCall = (roomId, me) => {
  const localStreamRef = useRef(null);
  const peerConnections = useRef({}); // userId -> RTCPeerConnection

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  /* ================= WEBRTC CONFIG ================= */
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
    ],
  };

  /* ================= GET MIC ================= */
  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    return stream;
  };

  /* ================= CREATE PEER ================= */
  const createPeerConnection = async (remoteUserId) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current[remoteUserId] = pc;

    const stream = await getLocalStream();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("group-ice-candidate", {
          toUserId: remoteUserId,
          fromUserId: me._id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const exists = prev.find(
          (s) => s.userId === remoteUserId
        );
        if (exists) return prev;

        return [
          ...prev,
          { userId: remoteUserId, stream: event.streams[0] },
        ];
      });
    };

    return pc;
  };

  /* ================= JOIN ROOM ================= */
  const joinGroupCall = async () => {
    await getLocalStream();

    socket.emit("join-group-call", {
      roomId,
      userId: me._id,
    });

    socket.emit("get-group-members", { roomId }, async (members) => {
      setConnectedUsers(members);

      for (const userId of members) {
        if (userId === me._id) continue;

        const pc = await createPeerConnection(userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("group-offer", {
          toUserId: userId,
          fromUserId: me._id,
          offer,
        });
      }
    });
  };

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    if (!roomId || !me?._id) return;

    joinGroupCall();

    socket.on("group-user-joined", async ({ userId }) => {
      if (userId === me._id) return;

      setConnectedUsers((prev) => [...prev, userId]);

      const pc = await createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("group-offer", {
        toUserId: userId,
        fromUserId: me._id,
        offer,
      });
    });

    socket.on("group-offer", async ({ fromUserId, offer }) => {
      const pc =
        peerConnections.current[fromUserId] ||
        (await createPeerConnection(fromUserId));

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("group-answer", {
        toUserId: fromUserId,
        fromUserId: me._id,
        answer,
      });
    });

    socket.on("group-answer", async ({ fromUserId, answer }) => {
      const pc = peerConnections.current[fromUserId];
      if (!pc) return;

      await pc.setRemoteDescription(answer);
    });

    socket.on("group-ice-candidate", async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current[fromUserId];
      if (!pc) return;

      await pc.addIceCandidate(candidate);
    });

    socket.on("group-user-left", ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }

      setRemoteStreams((prev) =>
        prev.filter((s) => s.userId !== userId)
      );

      setConnectedUsers((prev) =>
        prev.filter((id) => id !== userId)
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

      peerConnections.current = {};

      localStreamRef.current?.getTracks().forEach((t) => t.stop());

      socket.off("group-user-joined");
      socket.off("group-offer");
      socket.off("group-answer");
      socket.off("group-ice-candidate");
      socket.off("group-user-left");
    };
  }, [roomId, me?._id]);

  /* ================= CONTROLS ================= */
  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);

    socket.emit("group-toggle-mute", {
      roomId,
      userId: me._id,
      isMuted: !audioTrack.enabled,
    });
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
    connectedUsers,
    toggleMute,
    endCall,
  };
};

export default useGroupAudioCall;
