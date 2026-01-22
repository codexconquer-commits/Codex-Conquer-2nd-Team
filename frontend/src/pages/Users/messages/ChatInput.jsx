// ✅ IMPROVED: Using custom CSS classes (bg-darkmode, bg-lightmode, hide-scrollbar, theme-animate),
// better focus states, improved accessibility, and consistent styling with app theme

import { Send, Loader } from "lucide-react";
import { useState, useRef } from "react";
import socket from "../../../socket/socket.js";

const ChatInput = ({ text, setText, sendMessage, activeChat, me, isDark }) => {
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // ✅ NEW: State for send button loading
  const [isSending, setIsSending] = useState(false);

  // ✅ IMPROVED: Auto-resize textarea with typing indicator
  const handleInput = (e) => {
    const value = e.target.value;
    setText(value);

    if (!activeChat || !me) return;

    // Typing indicator logic
    if (!isTypingRef.current) {
      socket.emit("typing", {
        chatId: activeChat._id,
        senderName: me.fullName,
      });
      isTypingRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { chatId: activeChat._id });
      isTypingRef.current = false;
    }, 2000);

    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // ✅ IMPROVED: Better send handler with loading state
  const handleSend = async () => {
    if (!text.trim() || isSending) return;

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
    // ✅ IMPROVED: Using custom CSS classes for consistency
    <div
      className={`fixed md:static bottom-0 left-0 right-0 md:relative
        px-3 md:px-4 py-3 md:py-4
        rounded-t-2xl md:rounded-none
        border-t transition-colors duration-300 theme-animate
        ${isDark
          ? "bg-darkmode border-white/10 shadow-lg"
          : "bg-lightmode border-gray-200 shadow-md"}`}
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* ✅ IMPROVED: Textarea with custom CSS classes and better focus states */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          aria-label="Message input"
          disabled={isSending || !activeChat}
          rows={1}
          className={`flex-1 resize-none px-4 py-2.5 rounded-full outline-none
            transition-all duration-300 max-h-32 overflow-y-auto hide-scrollbar
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDark
              ? `bg-white/10 text-white placeholder-gray-400
                 focus:bg-white/15 focus:ring-2 focus:ring-blue-500
                 border border-white/20 focus:border-white/30`
              : `bg-white text-darkmode placeholder-gray-500
                 focus:bg-white focus:ring-2 focus:ring-blue-400
                 border border-gray-200 focus:border-blue-300 shadow-sm`
            }`}
        />

        {/* ✅ IMPROVED: Send button with loading state and better accessibility */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending || !activeChat}
          aria-label={isSending ? "Sending message" : "Send message"}
          title={!activeChat ? "Select a chat first" : isSending ? "Sending..." : "Send message"}
          className={`p-2.5 md:p-3 rounded-full flex-shrink-0
            transition-all duration-300 transform
            focus:outline-none focus:ring-2 focus:ring-blue-400/30
            ${
              !text.trim() || isSending || !activeChat
                ? `${isDark ? "bg-white/10 text-gray-500" : "bg-gray-200 text-gray-400"}
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

      {/* ✅ NEW: Character count and helper text */}
      <div className={`flex items-center justify-between mt-2 px-1 text-xs
        ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        <p>
          {text.length > 0 && `${text.length} character${text.length !== 1 ? "s" : ""}`}
        </p>
        
      </div>
    </div>
  );
};

export default ChatInput;
