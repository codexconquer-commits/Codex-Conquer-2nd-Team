import { ArrowLeft, Users, Phone, Video } from "lucide-react";

const ChatHeader = ({
  activeChat,
  me,
  isMobile,
  onBack,
}) => {
  if (!activeChat) return null;

  const isAdmin =
    activeChat.groupAdmin?.toString() === me?._id?.toString();

  return (
    <div className="sticky top-0 z-50 h-14 backdrop-blur-xl flex items-center px-4 border-b border-white/10">
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
        <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white">
          <Users size={18} />
        </div>

        {/* Group Info */}
        <div className="flex flex-col truncate">
          <h2 className="font-semibold truncate">
            {activeChat.groupName}
          </h2>

          <p className="text-xs opacity-70 truncate">
            {activeChat.members.length} members
            {isAdmin && (
              <span className="ml-2 text-yellow-400 font-semibold">
                • Admin
              </span>
            )}
          </p>
        </div>

        {/* Right actions (future ready) */}
        <div className="ml-auto flex gap-4 opacity-60">
          <Phone />
          <Video />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
