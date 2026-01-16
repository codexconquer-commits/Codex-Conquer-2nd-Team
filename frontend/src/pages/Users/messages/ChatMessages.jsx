const ChatMessages = ({
  messages,
  me,
  user,
  typingUser,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-3 pb-24">
      {messages.map((m, idx) => {
        const myId = me?._id || user?._id;
        const senderId =
          typeof m.senderId === "string"
            ? m.senderId
            : m.senderId?._id;

        const isMe = senderId === myId;

        return (
          <div
            key={m._id || idx}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 text-sm break-words
                ${
                  isMe
                    ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                    : "bg-gray-200 text-black rounded-2xl rounded-bl-md ml-3"
                }`}
            >
              <p className="text-[10px] mb-1 opacity-70">
                {isMe ? "You" : m.senderId?.fullName}
              </p>
              <p>{m.text}</p>
            </div>
          </div>
        );
      })}

      {typingUser && (
        <span className="text-xs text-gray-500 italic">
          {typingUser}
        </span>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
