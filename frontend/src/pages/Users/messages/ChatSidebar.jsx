import { Mic, X ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
const ChatSidebar = ({
  users = [],
  onlineUsers = [],
  onUserClick,
  isMobile = false,
  setShowChatMobile,
  isDark = false,
  activeChat,
}) => {
    const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (userId) => {
    onUserClick(userId);
    if (isMobile) setShowChatMobile(true);
  };

  return (
    <aside
      className={`
        ${isMobile ? "absolute left-0 top-14 z-20 w-full " : "relative"}
        flex flex-col md:w-[340px]
        h-[calc(100vh-3.5rem)]
        border-r border-white/10 theme-animate
        ${isDark ? "bg-darkmode text-darkmode" : "bg-lightmode text-lightmode"}
      `}
    >
      {/* ================= Header ================= */}

      <div
        className={`flex items-center justify-between px-4 py-4 border-b
        ${isDark ? "border-white/10" : "border-black/10"}`}
      >

         {isMobile && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg md:hidden icon-hover"
          >
            <ArrowLeft size={20} />

          </button>
        )}

        <h2 className="text-lg font-bold tracking-wide font-bold mr-auto ">
          Direct Messages
        </h2>


      </div>

      {/* ================= Search ================= */}
      <div className="px-4 py-3">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2.5
          transition-all duration-300
          ${
            isDark
              ? "bg-slate-800/50 border border-slate-700/50"
              : "bg-gray-100 border border-gray-200"
          }`}
        >
          <Mic size={18} className="opacity-70" />
          <input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchQuery && (
            <X
              size={16}
              onClick={() => setSearchQuery("")}
              className="cursor-pointer opacity-60 hover:opacity-100"
            />
          )}
        </div>
      </div>

      {/* ================= User List ================= */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-2 pb-4">
        <div className="space-y-1.5 mt-3">
          {filteredUsers.map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            const isActive = activeChat?.members
              ? activeChat.members.some(
                  (m) => (typeof m === "string" ? m : m._id) === u._id
                )
              : activeChat === u._id;

            return (
              <div
                key={u._id}
                onClick={() => handleUserClick(u._id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-all duration-300 group
                  ${
                    isActive
                      ? isDark
                        ? "bg-white/20 ring-2 ring-blue-500 shadow-lg"
                        : "bg-blue-100 ring-2 ring-blue-400 shadow-md"
                      : isDark
                      ? "hover:bg-white/15 active:bg-white/25"
                      : "hover:bg-black/8 active:bg-black/12"
                  }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full text-white flex items-center
                    justify-center font-bold text-sm
                    ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-blue-400 to-blue-500"
                    }
                    group-hover:scale-110 transition-transform duration-300
                    shadow-sm`}
                  >
                    {u?.fullName?.[0]?.toUpperCase()}
                  </div>

                  {/* Online Indicator */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full
                      border-2 transition-colors duration-300
                      ${
                        isOnline
                          ? "bg-green-500 border-green-600"
                          : "bg-gray-400 border-gray-500"
                      }
                      ${isDark ? "ring-1 ring-gray-800" : "ring-1 ring-white"}`}
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {u.fullName}
                  </p>
                  <p
                    className={`text-xs truncate opacity-70
                    ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Click to Chat
                  </p>
                </div>

                {/* Old Vertical Active Bar */}
                {isActive && (
                  <div
                    className="flex-shrink-0 w-1.5 h-6 rounded-full
                    bg-gradient-to-b from-blue-400 to-blue-600"
                  />
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="flex justify-center py-10">
              <p className="text-sm opacity-60">
                {searchQuery ? "No users found" : "No users available"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
