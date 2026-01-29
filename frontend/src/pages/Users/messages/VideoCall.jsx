// import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
// import { useRef, useEffect } from "react";

// const VideoCall = ({
//   open,
//   isConnected,
//   callerName,
//   isIncoming,
//   isMuted,
//   isCameraOff,
//   onAccept,
//   onReject,
//   onEnd,
//   onMuteToggle,
//   onCameraToggle,
//   localStream,
//   remoteVideoRef, // ✅ ADD THIS
// }) => {
//   const localVideoRef = useRef(null);


//   /* attach streams */
//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [remoteStream]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
//       {/* Remote video */}
//       <video
//         ref={remoteVideoRef}
//         autoPlay
//         playsInline
//         className="absolute inset-0 w-full h-full object-cover"
//       />

//       {/* Local preview */}
//       <video
//         ref={localVideoRef}
//         autoPlay
//         muted
//         playsInline
//         className="absolute bottom-24 right-6 w-36 h-48 rounded-xl object-cover border-2 border-white"
//       />

//       {/* Top info */}
//       <div className="absolute top-6 text-center text-white">
//         <h2 className="text-xl font-semibold">{callerName}</h2>
//         <p className="opacity-80">
//           {isConnected
//             ? "Connected"
//             : isIncoming
//             ? "Incoming Video Call…"
//             : "Calling…"}
//         </p>
//       </div>

//       {/* Controls */}
//       <div className="absolute bottom-8 flex gap-4">
//         {/* Mute */}
//         <button
//           onClick={onMuteToggle}
//           className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white"
//         >
//           {isMuted ? <MicOff /> : <Mic />}
//         </button>

//         {/* Camera */}
//         <button
//           onClick={onCameraToggle}
//           className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white"
//         >
//           {isCameraOff ? <VideoOff /> : <Video />}
//         </button>

//         {/* Accept */}
//         {isIncoming && !isConnected && (
//           <button
//             onClick={onAccept}
//             className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white"
//           >
//             <Video />
//           </button>
//         )}

//         {/* End / Reject */}
//         <button
//           onClick={isIncoming && !isConnected ? onReject : onEnd}
//           className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white"
//         >
//           <PhoneOff />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;


import React from 'react'

const VideoCall = () => {
  return (
    <div>VideoCall</div>
  )
}

export default VideoCall
