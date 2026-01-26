import { ArrowLeft, Users, Phone, Video } from "lucide-react";
import GroupInformationpopUp from "./GroupInformationpopUp";
import { useState,useEffect } from "react";

const ChatHeader = ({
  activeChat,
  me,
  isMobile,
  onBack,
  isAdmin,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!activeChat) return null;



  return (
    <div className="sticky top-0 z-50 h-14 font-regular backdrop-blur-xl flex items-center px-4 border-b border-white/10">
      <div className="flex items-center w-full gap-3">

        {/* Back button (mobile) */}
        {isMobile && (
          <button
            className="p-2 rounded-xl bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft />
          </button>
        )}

        {/* Group Icon */}
        <div
          className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white cursor-pointer"
          onClick={() => setShowInfo(true)}
        >
          <Users size={18} />
        </div>

        {/* Group Info */}
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
              <span className="ml-2 text-blue-500 font-medium text-xs">
                • Admin
              </span>
            )}
          </p>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex gap-4 opacity-60">
          <Phone className="cursor-pointer" />
          <Video className="cursor-pointer" />
        </div>
      </div>

      {/* Group Info Popup */}
      <div className="absolute top-10 w-[95vw] md:w-[55vw] ">


      <GroupInformationpopUp
        open={showInfo}
        isAdmin={isAdmin}
        onClose={() => setShowInfo(false)}
        group={{
          name: activeChat.groupName,
          members: activeChat.members,
          createdAt: activeChat.createdAt,
          groupAdmin: activeChat.groupAdmin,
          groupId: activeChat._id,

        }}
      />
      </div>
    </div>
  );
};

export default ChatHeader;
