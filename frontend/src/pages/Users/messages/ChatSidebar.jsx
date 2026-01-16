import { Mic, Plus, Settings } from "lucide-react";

const ChatSidebar = ({
  users = [],
  onlineUsers = [],
  onUserClick,
  isMobile,
  setShowChatMobile,
  isDark,
}) => {
  return (
    <aside
      className={`
        ${isMobile ? "absolute left-0 top-0 z-20" : "relative"}
        flex flex-col
        w-full md:w-[340px]
        h-full
        border-r border-white/10
        backdrop-blur-xl
        ${isDark ? "bg-darkmode" : "bg-lightmode"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h2 className="text-xl font-extrabold">Direct Messages</h2>
        <div className="flex gap-2">
          <button className="icon-hover p-2">
            <Settings />
          </button>
          <button className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
            <Plus />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2
            ${isDark ? "bg-white/10" : "bg-black/10"}`}
        >
          <input
            placeholder="Jump to or Search..."
            className="flex-1 bg-transparent outline-none"
          />
          <Mic size={18} />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-2 space-y-2 pb-4">
        {users.map((u) => {
          const isOnline = onlineUsers.includes(u._id?.toString());

          return (
            <div
              key={u._id}
              onClick={() => {
                onUserClick(u._id);
                if (isMobile) setShowChatMobile(true);
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
                ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-black/5 hover:bg-black/10"
                }
              `}
            >
              {/* Avatar */}
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {u?.fullName?.[0]}
                </div>

                {/* Online dot */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2
                    ${isOnline ? "bg-green-500" : "bg-gray-400"}
                    ${isDark ? "border-gray-800" : "border-white"}`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* Name */}
              <div className="flex-1 truncate">
                <p className="font-semibold truncate">{u.fullName}</p>
                <p className="text-xs opacity-70 truncate">Tap to chat</p>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-center text-sm opacity-60 mt-10">
            No users found
          </p>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
