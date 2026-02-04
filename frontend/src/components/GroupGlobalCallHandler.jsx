import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/Theme-Context";
import { useCallTrigger } from "../context/CallTriggerContext";
import useGroupAudioCall from "../hooks/useGroupAudioCall";
import GroupAudioCall from "../components/calls/GroupAudioCall";
import socket from "../socket/socket";

/**
 * 🪓 AXE LEVEL GROUP GLOBAL CALL HANDLER
 * WhatsApp-like behavior
 */
const GroupGlobalCallHandler = () => {
  const { user } = useContext(AppContext);
  const { groupCallRef, groupCallTick } = useCallTrigger();

  const [ringingCall, setRingingCall] = useState(null); // 🔔 popup
  const [activeCall, setActiveCall] = useState(null);   // 🎧 connected

  console.log("🟢 [GroupGlobalCallHandler] Rendered");

  /* =================================================
     ========== OUTGOING CALL TRIGGER =================
     ================================================= */
  useEffect(() => {
    if (!groupCallRef.current) return;

    console.log("📞 Outgoing group call", groupCallRef.current);

    // direct active (caller)
    setActiveCall(groupCallRef.current);
    groupCallRef.current = null;
  }, [groupCallTick]);

  /* =================================================
     ========== INCOMING CALL RINGING =================
     ================================================= */
  useEffect(() => {
    socket.on("group-call-ringing", (payload) => {
      console.log("🔔 Incoming group call", payload);
      setRingingCall(payload);
    });

    socket.on("group-call-ended", () => {
      setRingingCall(null);
      setActiveCall(null);
    });

    return () => {
      socket.off("group-call-ringing");
      socket.off("group-call-ended");
    };
  }, []);

  /* =================================================
     ========== ACCEPT / REJECT =======================
     ================================================= */
  const acceptCall = () => {
    if (!ringingCall) return;

    console.log("✅ Accepting group call");

    socket.emit("accept-group-call", {
      roomId: ringingCall.roomId,
      userId: user._id,
    });

    setActiveCall({
      type: ringingCall.type,
      groupId: ringingCall.roomId,
    });

    setRingingCall(null);
  };

  const rejectCall = () => {
    if (!ringingCall) return;

    console.log("❌ Rejecting group call");

    socket.emit("reject-group-call", {
      roomId: ringingCall.roomId,
      userId: user._id,
    });

    setRingingCall(null);
  };

  /* =================================================
     ========== AUDIO ENGINE ==========================
     ================================================= */
  const groupAudio = useGroupAudioCall(
    activeCall?.groupId ?? null,
    activeCall ? user : null
  );

  /* =================================================
     ========== UI STATES =============================
     ================================================= */

  /* 🔔 INCOMING POPUP */
  if (ringingCall && !activeCall) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-80 text-center">
          <h2 className="font-bold text-lg mb-2">
            Incoming Group Call
          </h2>
          <p className="text-sm opacity-70 mb-4">
            Someone is calling in this group
          </p>

          <div className="flex justify-between">
            <button
              onClick={rejectCall}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Reject
            </button>
            <button
              onClick={acceptCall}
              className="px-4 py-2 rounded bg-green-500 text-white"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 🎧 ACTIVE CALL */
  if (activeCall && activeCall.type === "audio") {
    return (
      <GroupAudioCall
        remoteStreams={groupAudio.remoteStreams}
        isMuted={groupAudio.isMuted}
        toggleMute={groupAudio.toggleMute}
        endCall={() => {
          console.log("❌ Ending group call");

          socket.emit("end-group-call", {
            roomId: activeCall.groupId,
            userId: user._id,
          });

          groupAudio.endCall();
          setActiveCall(null);
        }}
      />
    );
  }

  return null;
};

export default GroupGlobalCallHandler;
