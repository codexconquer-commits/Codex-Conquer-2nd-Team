import { ArrowLeft, Phone, Video } from "lucide-react";

const ChatHeader = ({
  activeChat,
  me,
  onlineUsers,
  isMobile,
  onBack,
  onCall,
  onVideoCall,
}) => {
  const otherUser = activeChat?.members?.find((m) => m._id !== me?._id);

  const isActiveUserOnline = onlineUsers.includes(otherUser?._id?.toString());

  return (
    <div className="sticky top-0 z-50 h-14 backdrop-blur-xl flex items-center px-4 border-b border-white/10">
      <div className="flex items-center w-full">
        {isMobile && (
          <button className="p-2 rounded-xl bg-white/10" onClick={onBack}>
            <ArrowLeft />
          </button>
        )}

        <div className="ml-4">
          <h2 className="font-semibold truncate">
            {otherUser?.fullName || "Unknown User"}
          </h2>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                isActiveUserOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {isActiveUserOnline ? "Online" : "Offline"}
          </div>
        </div>

        <div className="flex gap-4 ml-auto">
          <Phone
            className="cursor-pointer hover:text-green-500"
            onClick={onCall}
          />
          <Video
  className={`${
    isActiveUserOnline
      ? "cursor-pointer hover:text-blue-500"
      : "opacity-40 cursor-not-allowed"
  }`}
  onClick={() => {
    if (isActiveUserOnline && onVideoCall) {
        onVideoCall();
      }
  }}
/>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
