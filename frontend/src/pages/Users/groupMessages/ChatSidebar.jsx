import axios from "axios";
import { ArrowLeft, Check, Loader, Mic, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

const BASE = import.meta.env.VITE_BASE_URL;

const ChatSidebar = ({
  groups = [],
  onUserClick,
  isMobile,
  setShowChatMobile,
  isDark,
  activeChat,
  setGroups = () => {},
}) => {
  const [addPeople, setAddPeople] = useState(false);
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (addPeople) fetchUsers();
  }, [addPeople]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE}/api/groups/getAllUsers`, {
        withCredentials: true,
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async (e) => {
    e?.preventDefault();
    if (!groupName || selectedUsers.length < 1) return;

    setIsCreating(true);
    try {
      const res = await axios.post(
        `${BASE}/api/groups/addPeople`,
        { name: groupName, users: selectedUsers },
        { withCredentials: true }
      );

      setGroups((prev) => [res.data, ...prev]);
      setAddPeople(false);
      setStep(1);
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setAddPeople(false);
    setStep(1);
    setGroupName("");
    setSelectedUsers([]);
    setSearchQuery("");
  };

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      {/*
        Improved sidebar with better spacing, typography hierarchy, and dark/light mode support.
        Added proper z-index layering for mobile overlay.
      */}
      <aside
        className={`
          mt-14 md:mt-0
          ${isMobile ? "absolute left-0 top-0 z-30" : "relative"}
          w-full md:w-[340px] h-[calc(100vh-3.5rem)] md:h-full flex flex-col
          border-r border-white/10
          transition-all duration-300
          ${isDark ? "bg-darkmode text-darkmode " : "bg-lightmode text-lightmode "}
        `}
      >

        {/* Header with improved spacing and icon styling */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? "border-slate-700/50" : "border-gray-200/50"
          } backdrop-blur-sm mt-13`}
        >
          <h2 className="text-lg font-bold tracking-tight">Group Messages</h2>
          <button
            onClick={() => setAddPeople(true)}
            aria-label="Create new group"
            className={`p-2.5 rounded-lg transition-all duration-300 transform active:scale-95
              bg-gradient-to-r from-blue-500 to-purple-600 text-white
              hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search input with improved focus states and icon alignment */}
        <div className="px-4 py-3">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-300
              ${
                isDark
                  ? "bg-slate-800/50 border border-slate-700/50 focus-within:border-blue-500/50 focus-within:bg-slate-800"
                  : "bg-gray-100/80 border border-gray-200/50 focus-within:border-blue-400 focus-within:bg-white"
              }`}
          >
            <Mic
              size={18}
              className={isDark ? "text-gray-400" : "text-gray-500"}
            />
            <input
              placeholder="Search groups..."
              aria-label="Search groups"
              className={`flex-1 bg-transparent outline-none text-sm
                ${isDark ? "placeholder-gray-500" : "placeholder-gray-400"}`}
            />
          </div>
        </div>

        {/* Groups list with improved hover states and active state styling */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No groups yet
              </p>
            </div>
          ) : (
            groups.map((g) => {
              const active = activeChat?._id === g._id;
              return (
                <div
                  key={g._id}
                  onClick={() => {
                    onUserClick(g._id);
                    if (isMobile) setShowChatMobile(true);
                  }}
                  className={`px-4 py-3 rounded-lg mt-2 cursor-pointer transition-all duration-300 transform active:scale-98
                    ${
                      active
                        ? isDark
                          ? "bg-blue-500/20 ring-1 ring-blue-500/50 text-blue-300"
                          : "bg-blue-50 ring-1 ring-blue-300 text-blue-900"
                        : isDark
                        ? "hover:bg-slate-800/50"
                        : "hover:bg-gray-100/80"
                    }
                  `}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onUserClick(g._id);
                      if (isMobile) setShowChatMobile(true);
                    }
                  }}
                >
                  <p className="font-semibold text-sm">{g.groupName}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= ADD MEMBERS MODAL ================= */}
      {/*
        Improved modal with better backdrop blur, smooth transitions, and improved accessibility.
        Better z-index hierarchy and overlay management.
      */}
      {addPeople && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
              transition-all duration-300 animate-in fade-in zoom-in-95
              ${isDark ? "bg-slate-900 text-white" : "bg-white text-gray-900"}`}
          >
            {/* ===== STEP 1: SELECT MEMBERS ===== */}
            {step === 1 && (
              <>
                {/* Header with better spacing and close button */}
                <div
                  className={`px-5 py-4 border-b ${
                    isDark
                      ? "border-slate-700/50 bg-slate-800/30"
                      : "border-gray-200/50 bg-gray-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={resetModal}
                      aria-label="Close modal"
                      className={`p-2 rounded-lg transition-all duration-300
                        ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-200"}
                        focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 text-center">
                      <h3 className="text-base font-bold">Add members</h3>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {selectedUsers.length}/{users.length}
                      </p>
                    </div>
                    <button
                      onClick={() => selectedUsers.length >= 1 && setStep(2)}
                      disabled={selectedUsers.length < 1}
                      aria-label="Proceed to next step"
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300
                        ${
                          selectedUsers.length < 1
                            ? isDark
                              ? "bg-slate-700/50 text-gray-500 cursor-not-allowed"
                              : "bg-gray-200/50 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
                    >
                      Next
                    </button>
                  </div>

                  {/* Search with improved styling */}
                  <div className="relative group">
                    <Search
                      size={18}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or email"
                      aria-label="Search users"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg transition-all duration-300
                        ${
                          isDark
                            ? "bg-slate-700/50 border border-slate-600/50 text-white placeholder-gray-500 focus:bg-slate-700 focus:border-blue-500/50"
                            : "bg-gray-100/80 border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-400"
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-400/20`}
                    />
                  </div>
                </div>

                {/* Users list with improved scroll behavior and empty state */}
                <div
                  className={`max-h-[60vh] overflow-y-auto p-2 ${
                    isDark ? "bg-slate-900/50" : "bg-white/50"
                  }`}
                >
                  {filteredUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No users found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((u) => {
                        const sel = selectedUsers.includes(u._id);
                        return (
                          <div
                            key={u._id}
                            onClick={() => toggleUser(u._id)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 group
                              ${
                                sel
                                  ? isDark
                                    ? "bg-blue-500/20"
                                    : "bg-blue-50"
                                  : isDark
                                  ? "hover:bg-slate-800/50"
                                  : "hover:bg-gray-100/80"
                              }`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleUser(u._id);
                              }
                            }}
                          >
                            {/* Avatar with improved styling */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold
                              transition-transform duration-300
                              ${
                                sel
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 scale-110"
                                  : "bg-gradient-to-br from-purple-400 to-purple-500 group-hover:scale-105"
                              }
                            `}
                            >
                              {u.fullName?.[0]?.toUpperCase()}
                            </div>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {u.fullName}
                              </p>
                              <p
                                className={`text-xs truncate ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {u.email}
                              </p>
                            </div>

                            {/* Checkbox with improved animation */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                transition-all duration-300
                                ${
                                  sel
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 border-transparent"
                                    : isDark
                                    ? "border-slate-600 group-hover:border-blue-500"
                                    : "border-gray-300 group-hover:border-blue-400"
                                }
                              `}
                            >
                              {sel && (
                                <Check
                                  size={12}
                                  className="text-white font-bold"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== STEP 2: GROUP NAME ===== */}
            {step === 2 && (
              <div className="p-8 space-y-6">
                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  aria-label="Go back to member selection"
                  className={`p-2 rounded-lg transition-all duration-300
                    ${isDark ? "hover:bg-slate-800" : "hover:bg-gray-200"}
                    focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
                >
                  <ArrowLeft size={20} />
                </button>

                {/* Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold">New Group</h2>
                  <p
                    className={`text-sm mt-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Add a group name
                  </p>
                </div>

                {/* Group name input */}
                <div className="space-y-2">
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
                    placeholder="Enter group name"
                    aria-label="Group name"
                    maxLength={50}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300
                      ${
                        isDark
                          ? "bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:bg-slate-700/50 focus:border-blue-500"
                          : "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-400"
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-400/20`}
                  />
                  <p
                    className={`text-xs text-right ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {groupName.length}/50
                  </p>
                </div>

                {/* Create button with loading state */}
                <button
                  onClick={createGroup}
                  disabled={!groupName || isCreating}
                  aria-label="Create group"
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
                    ${
                      !groupName || isCreating
                        ? isDark
                          ? "bg-slate-700/50 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200/50 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
                >
                  {isCreating && <Loader size={18} className="animate-spin" />}
                  {isCreating ? "Creating..." : "Create Group"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;
