import { Mic, Plus } from "lucide-react";

const ChatSidebar = ({
  groups = [],
  onUserClick,
  isMobile,
  setShowChatMobile,
  isDark,
  activeChat,
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
      <div className="flex items-center mt-12 justify-between px-4 py-4 border-b border-white/10">
        <h2 className="text-xl font-extrabold">Group Messages</h2>

        <button className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
          <Plus />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2
          ${isDark ? "bg-white/10" : "bg-black/10"}`}
        >
          <input
            placeholder="Search groups..."
            className="flex-1 bg-transparent outline-none"
          />
          <Mic size={18} />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-2 space-y-2 pb-4">
        {groups.map((group) => {
          const isActive = activeChat?._id === group._id;

          return (
            <div
              key={group._id}
              onClick={() => {
                onUserClick(group._id);
                if (isMobile) setShowChatMobile(true);
              }}
              className={`
                flex items-center gap-3 px-4 py-3 mt-3 rounded-xl cursor-pointer
                transition-colors
                ${
                  isActive
                    ? isDark
                      ? "bg-white/30 ring-2 ring-blue-500"
                      : "bg-blue-100 ring-2 ring-blue-400"
                    : isDark
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-black/5 hover:bg-black/10"
                }
              `}
            >
              {/* Group Avatar */}
              <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                {group.groupName?.[0]}
              </div>

              {/* Group Info */}
              <div className="flex-1 truncate">
                <p className="font-semibold truncate">
                  {group.groupName}
                </p>
                <p className="text-xs opacity-70 truncate">
                  {group.members.length} members
                </p>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <p className="text-center text-sm opacity-60 mt-10">
            No groups found
          </p>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
