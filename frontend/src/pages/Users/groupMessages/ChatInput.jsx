import { Send } from "lucide-react";
import { useRef } from "react";
import socket from "../../../socket/socket.js";

const ChatInput = ({
  text,
  setText,
  sendMessage,
  activeChat,
  me,
  isDark,
}) => {
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  return (
    <div
      className={`${
        isDark ? "bg-gray-800" : "bg-[#f3f3f3]"
      } p-3 rounded-2xl`}
    >
      <div className="flex items-center gap-2">
        <textarea
          value={text}
          rows={1}
          placeholder="Type a message..."
          className={`flex-1 resize-none px-4 py-2 rounded-full outline-none
            ${
              isDark
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            }`}
          onChange={(e) => {
            setText(e.target.value);

            if (!activeChat || !me) return;

            if (!isTypingRef.current) {
              socket.emit("typing", {
                chatId: activeChat._id,
                senderName: me.fullName,
              });
              isTypingRef.current = true;
            }

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              socket.emit("stop-typing", {
                chatId: activeChat._id,
              });
              isTypingRef.current = false;
            }, 2000);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"
        >
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
