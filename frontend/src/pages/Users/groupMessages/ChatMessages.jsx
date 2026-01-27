
const formatSeparatorDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  // Normalize dates to compare only the date part (ignore time)
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(messageDate, today)) {
    return "Today";
  } else if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

/**
 * Check if date changed from previous message
 * Used to determine if we need to insert a date separator
 */
const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true; // Always show for first message

  const currentDate = new Date(currentMessage.createdAt);
  const previousDate = new Date(previousMessage.createdAt);

  // Compare only the date part (ignore time)
  return (
    currentDate.getFullYear() !== previousDate.getFullYear() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getDate() !== previousDate.getDate()
  );
};

// ================= MAIN COMPONENT =================

const ChatMessages = ({
  messages = [],
  me,
  user,
  typingUser,
  messagesEndRef,
  isDark,
}) => {
  const myId = me?._id || user?._id;

  return (
    <div
      className={`flex-1 px-3 md:px-4 py-4 pb-24 space-y-3 overflow-y-auto hide-scrollbar theme-animate
        ${
          isDark ? "bg-darkmode text-darkmode " : "bg-lightmode text-lightmode "
        }`}
    >
      {/* ================= Messages ================= */}
      {messages.length > 0 ? (
        messages.map((m, idx) => {
          const senderId =
            typeof m.senderId === "string" ? m.senderId : m.senderId?._id;

          const isMe = senderId === myId;
          const previousMessage = idx > 0 ? messages[idx - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(m, previousMessage);

          return (
            <div key={m._id || idx}>
              {/* ================= Date Separator ================= */}
              {showDateSeparator && (
                <div className="flex items-center gap-3 my-4">
                  <div
                    className={`flex-1 h-px ${
                      isDark ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  />
                  <p
                    className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap
                      ${
                        isDark
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {formatSeparatorDate(m.createdAt)}
                  </p>
                  <div
                    className={`flex-1 h-px ${
                      isDark ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}

              {/* ================= Message Bubble ================= */}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-2.5 text-sm break-words
                  rounded-2xl shadow transition-all duration-200 hover:shadow-lg
                  ${
                    isMe
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
                      : isDark
                      ? "bg-gray-700 text-gray-100 rounded-bl-sm"
                      : "bg-gray-200 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {/* Sender name */}
                  <p
                    className={`text-xs mb-1 font-medium opacity-70
                    ${
                      isMe
                        ? "text-blue-100"
                        : isDark
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    {isMe ? "You" : m.senderId?.fullName || "Unknown User"}
                  </p>

                  {/* Message text */}
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Timestamp */}
                  {m.createdAt && (
                    <p
                      className={`text-xs mt-1 opacity-60 text-right
                      ${
                        isMe
                          ? "text-blue-100"
                          : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Empty state */
        <div className="flex items-center justify-center h-32">
          <p className="text-sm opacity-60">
            No messages yet. Start the conversation!
          </p>
        </div>
      )}

      {/* ================= Typing Indicator ================= */}
      {typingUser && (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs italic opacity-70">{typingUser}</span>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} className="h-0" aria-hidden />
    </div>
  );
};

export default ChatMessages;
