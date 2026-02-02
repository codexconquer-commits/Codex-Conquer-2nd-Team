import { ArrowLeft, Phone, Video } from "lucide-react";
import { useCallTrigger } from "../../../context/CallTriggerContext";

const ChatHeader = ({
  activeChat,
  me,
  onlineUsers,
  isMobile,
  onBack,
}) => {
  const { audioTargetRef, videoTargetRef } = useCallTrigger();

  const otherUser = activeChat?.members?.find(
    (m) => m._id !== me?._id
  );

  const isOnline = onlineUsers.includes(
    otherUser?._id?.toString()
  );

  return (
    <div className="sticky top-0 z-50 h-14 flex items-center px-4 border-b border-white/10 backdrop-blur">
      {isMobile && (
        <button onClick={onBack} className="p-2">
          <ArrowLeft />
        </button>
      )}

      <div className="ml-3">
        <div className="font-semibold">
          {otherUser?.fullName || "User"}
        </div>
        <div className="text-xs text-gray-400">
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      <div className="ml-auto flex gap-4">
        <Phone
          className="cursor-pointer hover:text-green-500"
          onClick={() => {
            if (audioTargetRef.current && otherUser) {
              audioTargetRef.current(otherUser);
            }
          }}
        />

        <Video
          className={`${
            isOnline
              ? "cursor-pointer hover:text-blue-500"
              : "opacity-40 cursor-not-allowed"
          }`}
          onClick={() => {
            if (isOnline && videoTargetRef.current && otherUser) {
              videoTargetRef.current(otherUser);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ChatHeader;
