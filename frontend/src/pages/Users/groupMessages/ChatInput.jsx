// ✅ IMPROVED: Better responsiveness, auto-expanding textarea, improved focus states,
// accessibility enhancements, loading states, and modern UI polish

import { Send, Loader } from "lucide-react";
import { useRef, useState } from "react";
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
  const textareaRef = useRef(null);

  // ✅ NEW: State for send button loading
  const [isSending, setIsSending] = useState(false);

  // ✅ IMPROVED: Auto-expand textarea as user types
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        120
      ) + "px";
    }

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
  };

  // ✅ IMPROVED: Better send handler with loading state
  const handleSend = async () => {
    if (!text.trim()) return;

    setIsSending(true);
    try {
      await sendMessage();

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ✅ IMPROVED: Keyboard handler with better logic
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // ✅ IMPROVED: Using custom CSS classes (bg-lightmode, bg-darkmode, etc.)
    <div
      className={`fixed md:static bottom-0 left-0 right-0 md:relative
        px-3 md:px-4 py-3 md:py-4 
        border-t transition-colors duration-300 theme-animate
        ${isDark ? "bg-darkmode border-white/10" : "bg-lightmode border-gray-200"}
        shadow-lg md:shadow-none rounded-t-2xl md:rounded-none`}
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* ✅ IMPROVED: Textarea with better styling and focus states using custom classes */}
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="Type a message... (Shift+Enter for new line)"
          aria-label="Message input"
          disabled={isSending || !activeChat}
          className={`flex-1 resize-none px-4 py-2.5 rounded-full outline-none
            transition-all duration-300 max-h-32 overflow-y-auto hide-scrollbar
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDark
              ? `bg-white/10 text-white placeholder-gray-400
                 focus:bg-white/15 focus:ring-2 focus:ring-blue-500
                 border border-white/20 focus:border-white/30`
              : `bg-gray-100 text-darkmode placeholder-gray-500
                 focus:bg-white focus:ring-2 focus:ring-blue-400
                 border border-gray-200 focus:border-blue-300 shadow-sm`
            }`}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
        />

        {/* ✅ IMPROVED: Send button with loading state and better accessibility */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending || !activeChat}
          aria-label={isSending ? "Sending message" : "Send message"}
          title={!activeChat ? "Select a chat first" : "Send message"}
          className={`p-2.5 md:p-3 rounded-full flex-shrink-0
            transition-all duration-300 transform
            focus:outline-none focus:ring-2 focus:ring-blue-400/30
            ${
              !text.trim() || isSending || !activeChat
                ? `${isDark ? "bg-lightmode  text-lightmode " : "bg-darkmode text-darkmode"}
                   cursor-not-allowed opacity-50`
                : `bg-gradient-to-r from-blue-500 to-blue-600 text-white
                   hover:shadow-lg hover:shadow-blue-500/30
                   hover:scale-105 active:scale-95`
            }`}
        >
          {isSending ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {/* ✅ NEW: Character count and helper text for mobile */}
      <div className="flex items-center justify-between mt-2 px-1 text-xs">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          {text.length > 0 && `${text.length} character${text.length !== 1 ? "s" : ""}`}
        </p>

      </div>
    </div>
  );
};

export default ChatInput;
