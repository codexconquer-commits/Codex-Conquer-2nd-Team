import { ArrowLeft, Users, Phone, Video } from "lucide-react";
import { useState } from "react";
import { useCallTrigger } from "../../../context/CallTriggerContext";
import GroupInformationpopUp from "./GroupInformationpopUp";

const ChatHeader = ({ activeChat, isMobile, onBack, isAdmin }) => {
  const [showInfo, setShowInfo] = useState(false);
  const { groupCallRef, setGroupCallTick } = useCallTrigger();

  if (!activeChat) return null;

  console.log("🟢 [ChatHeader] Rendered:", activeChat._id);

  /* ================= START GROUP CALL ================= */
  const startGroupCall = (type) => {
    if (!activeChat?._id) {
      console.warn("⚠️ [ChatHeader] No activeChat");
      return;
    }

    console.log(`📞 [ChatHeader] ${type} call clicked`, activeChat._id);

    groupCallRef.current = {
      type,                 // "audio" | "video"
      groupId: activeChat._id,
    };


    setGroupCallTick((t) => t + 1);
  };

  return (
    <div className="sticky  w-[100] top-0 z-50 h-14 backdrop-blur-xl flex items-center px-4 border-b border-white/10">
      <div className="flex items-center w-full gap-3">
        {/* ← Back */}
        {isMobile && (
          <button
            className="p-2 rounded-xl bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft />
          </button>
        )}

        {/* 👥 Group avatar */}
        <div
          className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white cursor-pointer"
          onClick={() => setShowInfo(true)}
        >
          <Users size={18} />
        </div>

        {/* 📛 Group info */}
        <div
          className="flex flex-col truncate cursor-pointer"
          onClick={() => setShowInfo(true)}
        >
          <h2 className="font-semibold truncate">
            {activeChat.groupName}
          </h2>
          <p className="text-xs opacity-70 truncate">
            {activeChat.members.length} members
            {isAdmin && (
              <span className="ml-2 text-blue-500 text-xs">• Admin</span>
            )}
          </p>
        </div>

        {/* 🔥 GROUP CALL BUTTONS */}
        <div className="ml-auto flex gap-4 opacity-60">
          <Phone
            className="cursor-pointer hover:opacity-100"
            onClick={() => startGroupCall("audio")}
          />

          <Video
            className="cursor-pointer hover:opacity-100"
            onClick={() => startGroupCall("video")} // future
          />
        </div>
      </div>

      {/* ℹ️ Group info popup */}
      <GroupInformationpopUp
        open={showInfo}
        isAdmin={isAdmin}
        onClose={() => setShowInfo(false)}
        group={activeChat}
      />
    </div>
  );
};

export default ChatHeader;
