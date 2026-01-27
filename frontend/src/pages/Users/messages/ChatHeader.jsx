import { ArrowLeft, Phone, Video } from "lucide-react";
import AudioCall from "./AudioCall";
import { useState } from "react";

const ChatHeader = ({
  activeChat,
  me,
  onlineUsers,
  isMobile,
  onBack,
  onCall,
  isCallOpen,

}) => {
  // get other user
  const otherUser = activeChat?.members?.find(
    (m) => m._id !== me?._id
  );

  const isActiveUserOnline = onlineUsers.includes(
    otherUser?._id?.toString()
  );

  return (
    <div
      className="
        sticky top-0 z-50 h-14
        backdrop-blur-xl
        flex items-center px-4 py-3
        border-b border-white/10
      "
    >
      <div className="flex items-center justify-between w-full">
        {/* Back button (mobile only) */}
        {isMobile && (
          <button
            className="flex gap-2 p-2 rounded-xl bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft />
          </button>
        )}

        {/* User name + status */}
        <div className="flex flex-col justify-center gap-1 ml-4">
          <h2 className="font-semibold text-base sm:text-lg leading-tight truncate">
            {otherUser?.fullName || "Unknown User"}
          </h2>

          <div className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isActiveUserOnline
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            <p className="text-xs text-gray-500">
              {isActiveUserOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Call icons */}
        <div className="flex gap-4 ml-auto">
         <Phone
  className="cursor-pointer"
  onClick={onCall}
/>
          <Video />
        </div>
      </div>
      <div className="absolute top-20 w-[95vw] md:w-[55vw]">

      <AudioCall isCallOpen={isCallOpen} />
      </div>
    </div>
  );
};

export default ChatHeader;
