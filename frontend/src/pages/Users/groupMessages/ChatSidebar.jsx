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
  setGroups = () => {}, // ✅ Safe fallback if prop missing
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
    const res = await axios.get(`${BASE}/api/groups/getAllUsers`, {
      withCredentials: true,
    });
    setUsers(res.data || []);
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
    if (!groupName || selectedUsers.length < 1) return; // ✅ Allow 1 user

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
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside
        className={` mt-14
          ${isMobile ? "absolute z-20" : "relative"}
          w-full md:w-[340px] h-full flex flex-col
          border-r border-white/10
          ${isDark ? "bg-slate-900 text-white" : "bg-white text-gray-900"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold">Group Messages</h2>
          <button
            onClick={() => setAddPeople(true)}
            className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white"
          >
            <Plus />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2
              ${isDark ? "bg-white/10" : "bg-black/5"}`}
          >
            <input
              placeholder="Search groups..."
              className="flex-1 bg-transparent outline-none"
            />
            <Mic size={18} />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-2">
          {groups.map((g) => {
            const active = activeChat?._id === g._id;
            return (
              <div
                key={g._id}
                onClick={() => {
                  onUserClick(g._id);
                  if (isMobile) setShowChatMobile(true);
                }}
                className={`px-4 py-3 mt-2 rounded-xl cursor-pointer
                  ${
                    active
                      ? "bg-blue-500/20 ring-2 ring-blue-500"
                      : isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-black/5"
                  }`}
              >
                <p className="font-semibold">{g.groupName}</p>
                <p className="text-xs opacity-70">{g.members.length} members</p>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ================= ADD MEMBERS MODAL ================= */}
      {addPeople && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-xl
              ${isDark ? "bg-slate-900 text-white" : "bg-white text-gray-900"}`}
          >
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setAddPeople(false)}>
                      <ArrowLeft />
                    </button>
                    <div className="text-center">
                      <p className="font-bold">Add members</p>
                      <p className="text-xs opacity-70">
                        {selectedUsers.length}/{users.length}
                      </p>
                    </div>
                    <button
                      onClick={
                        () => selectedUsers.length >= 1 && setStep(2) // ✅ Allow 1 user
                      }
                      disabled={selectedUsers.length < 1} // ✅ Fixed condition
                      className={`px-3 py-1 rounded-lg font-semibold
                        ${
                          selectedUsers.length < 1
                            ? "opacity-40"
                            : "bg-blue-500 text-white"
                        }`}
                    >
                      Next
                    </button>
                  </div>

                  <div className="mt-4 relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or Email"
                      className={`w-full pl-10 pr-4 py-2 rounded-xl
                        ${isDark ? "bg-white/10" : "bg-black/5"}
                        outline-none`}
                    />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {filteredUsers.map((u) => {
                    const sel = selectedUsers.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleUser(u._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
                          ${
                            sel
                              ? "bg-blue-500/20"
                              : isDark
                              ? "hover:bg-white/10"
                              : "hover:bg-black/5"
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {u.fullName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{u.fullName}</p>
                          <p className="text-xs opacity-70">{u.email}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center
                            ${
                              sel
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-400"
                            }`}
                        >
                          {sel && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="p-6 space-y-6">
                <button onClick={() => setStep(1)}>
                  <ArrowLeft />
                </button>

                <div className="text-center">
                  <h2 className="text-2xl font-bold">New Group</h2>
                  <p className="text-sm opacity-70">Add a subject</p>
                </div>

                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
                  placeholder="Group name"
                  className={`w-full px-4 py-3 rounded-xl outline-none
                    ${isDark ? "bg-white/10" : "bg-black/5"}`}
                />

                <button
                  onClick={createGroup}
                  disabled={!groupName || isCreating}
                  className={`w-full py-3 rounded-xl font-semibold flex justify-center gap-2
                    ${
                      !groupName || isCreating
                        ? "opacity-40"
                        : "bg-blue-500 text-white"
                    }`}
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
