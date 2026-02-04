import { useEffect, useRef } from "react";

/**
 * 🪓 AXE LEVEL GROUP AUDIO CALL UI
 * - Reliable audio playback
 * - Mobile safe
 * - Proper cleanup
 */
const GroupAudioCall = ({
  remoteStreams,
  isMuted,
  toggleMute,
  endCall,
}) => {
  const audioRefs = useRef({});

  /* ================= ATTACH AUDIO ================= */
  useEffect(() => {
    remoteStreams.forEach(({ userId, stream }) => {
      if (audioRefs.current[userId]) return;

      console.log("🔊 Attaching audio for", userId);

      const audio = document.createElement("audio");
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.playsInline = true;
      audio.muted = false;
      audio.controls = false;

      document.body.appendChild(audio);
      audioRefs.current[userId] = audio;

      const tryPlay = async () => {
        try {
          await audio.play();
          console.log("✅ Audio playing from", userId);
        } catch (err) {
          console.warn(
            "⚠️ Autoplay blocked, retrying on user interaction"
          );

          const resume = async () => {
            try {
              await audio.play();
              console.log("✅ Audio resumed from", userId);
              window.removeEventListener("click", resume);
            } catch {}
          };

          window.addEventListener("click", resume);
        }
      };

      tryPlay();
    });
  }, [remoteStreams]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning audio elements");

      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      });

      audioRefs.current = {};
    };
  }, []);

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center">
      <div className="bg-neutral-900 p-6 rounded-xl w-[320px] text-white text-center">
        <h2 className="text-lg font-semibold mb-2">
          Group Audio Call
        </h2>

        <p className="text-sm opacity-70 mb-4">
          {remoteStreams.length + 1} participants
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={toggleMute}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-600 rounded"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupAudioCall;
