import { Lock, Trash2, UserPlus, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import api from "../../../api/axios";
import { AppContext } from "../../../context/Theme-Context";

const GroupInformationPopUp = ({
  open,
  onClose,
  group,
  isAdmin,
  onMemberRemoved,
}) => {
  const { isDark } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [error, setError] = useState(null);

  // ✅ Sync members state with group prop whenever group changes
  useEffect(() => {
    if (group?.members) {
      setMembers([...group.members]); // Create fresh copy
    } else {
      setMembers([]);
    }
    setError(null);
  }, [group?._id, open]); // Re-sync when group ID or modal opens

  if (!open || !group) return null;

  /* ================= HELPERS ================= */

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= MEMBER ACTIONS ================= */

  const handleRemoveUser = async (memberId) => {
    // Prevent multiple clicks
    if (removingMemberId) return;

    setRemovingMemberId(memberId);
    setError(null);

    try {
      await api.put("/api/groups/removeUser", {
        groupId: group._id,
        userId: memberId,
      });

      // Single state update triggers one re-render
      setMembers((prevMembers) =>
        prevMembers.filter((m) => m._id !== memberId)
      );

      // Notify parent component about member removal
      if (onMemberRemoved) {
        onMemberRemoved(memberId, group._id);
      }
    } catch (err) {
      console.error("Remove user failed:", err);
      setError(err?.response?.data?.message || "Failed to remove user");
    } finally {
      // Reset button state regardless of success/failure
      setRemovingMemberId(null);
    }
  };

  const MemberActions = ({ member }) => {
    if (!isAdmin) return null;

    const isRemoving = removingMemberId === member._id;

    return (
      <button
        onClick={() => handleRemoveUser(member._id)}
        disabled={isRemoving || removingMemberId !== null}
        title={isRemoving ? "Removing..." : "Remove member"}
        className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0
          ${
            isRemoving || removingMemberId !== null
              ? "text-gray-400 cursor-not-allowed"
              : `text-red-500 ${
                  isDark ? "hover:bg-red-500/10" : "hover:bg-red-100"
                }`
          }`}
        aria-label={isRemoving ? "Removing member..." : "Remove member"}
      >
        <Trash2 size={16} />
      </button>
    );
  };

  /* ================= UI ================= */

  return (
    <div className=" inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm
          ${isDark ? "bg-black/80" : "bg-black/50"}`}
      />

      {/* Modal - Responsive Container */}
      <div
        className={`relative w-full max-w-md sm:max-w-lg md:max-w-xl
          max-h-[85vh] sm:max-h-[80vh] md:max-h-[75vh]
          rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col
          ${
            isDark
              ? "bg-slate-900 text-white border border-white/10"
              : "bg-white text-black border border-gray-200"
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b flex-shrink-0
            ${isDark ? "border-white/10" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">
              {group.name}
            </h2>
            <Lock
              size={16}
              className="text-green-500 flex-shrink-0 hidden sm:block"
            />
          </div>

          {isAdmin && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 whitespace-nowrap flex-shrink-0">
              Admin
            </span>
          )}

          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-colors
              ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
            aria-label="Close group information"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions - Only show if admin */}
        {isAdmin && (
          <div
            className={`px-4 sm:px-6 py-3 border-b flex-shrink-0
              ${isDark ? "border-white/10" : "border-gray-200"}`}
          >
            <button
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors w-full sm:w-auto
                ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
            >
              <UserPlus size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Add Member</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          className={`flex gap-4 sm:gap-6 px-4 sm:px-6 border-b overflow-x-auto flex-shrink-0
            ${isDark ? "border-white/10" : "border-gray-200"}`}
        >
          <button
            onClick={() => setActiveTab("members")}
            className={`py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors
              ${
                activeTab === "members"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "opacity-60 hover:opacity-100"
              }`}
          >
            Members ({members.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors
              ${
                activeTab === "about"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "opacity-60 hover:opacity-100"
              }`}
          >
            About
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === "members" && (
            <>
              {/* Error Message */}
              {error && (
                <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm">
                  {error}
                </div>
              )}

              {/* Search Bar - Sticky */}
              <div
                className={`px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 border-b flex-shrink-0
                  ${
                    isDark
                      ? "bg-slate-900 border-white/10"
                      : "bg-white border-gray-200"
                  }`}
              >
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg outline-none transition-colors
                    ${
                      isDark
                        ? "bg-white/10 placeholder-gray-400 focus:bg-white/20"
                        : "bg-gray-100 placeholder-gray-600 focus:bg-gray-200"
                    }`}
                />
              </div>

              {/* Members List */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-2 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <div
                      key={m._id}
                      className={`flex items-center justify-between gap-2 p-2.5 sm:p-3 md:p-4 rounded-lg transition-all duration-200
                        ${
                          removingMemberId === m._id
                            ? isDark
                              ? "opacity-50 bg-white/5"
                              : "opacity-50 bg-gray-100"
                            : isDark
                            ? "hover:bg-white/5"
                            : "hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                          {(m.name || m.fullName || "U")[0].toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm md:text-base truncate">
                            {m.name || m.fullName}
                          </p>
                          <p className="text-xs opacity-60 truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      <MemberActions member={m} />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs sm:text-sm opacity-60 py-8">
                    No members found
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === "about" && (
            <div className="px-4 sm:px-6 py-8 sm:py-10 text-center opacity-60 text-xs sm:text-sm md:text-base">
              <p className="mb-2">📋 Group Information</p>
              <p>
                {new Date(group.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInformationPopUp;
