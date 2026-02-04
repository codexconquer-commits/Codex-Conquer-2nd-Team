import { createContext, useContext, useRef, useState } from "react";

const CallTriggerContext = createContext();

export const CallTriggerProvider = ({ children }) => {
  const audioTargetRef = useRef(null);
  const videoTargetRef = useRef(null);
  const groupCallRef = useRef(null);

  
  const [groupCallTick, setGroupCallTick] = useState(0);
  console.log("🟢 CallTriggerProvider rendered");

  return (
    <CallTriggerContext.Provider
      value={{
        audioTargetRef,
        videoTargetRef,
        groupCallRef,
        groupCallTick,
        setGroupCallTick,
      }}
    >
      {children}
    </CallTriggerContext.Provider>
  );
};

export const useCallTrigger = () => useContext(CallTriggerContext);
