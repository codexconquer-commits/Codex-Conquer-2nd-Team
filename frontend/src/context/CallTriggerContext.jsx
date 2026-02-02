import { createContext, useContext, useRef } from "react";

const CallTriggerContext = createContext();

export const CallTriggerProvider = ({ children }) => {
  const audioTargetRef = useRef(null);
  const videoTargetRef = useRef(null);

  return (
    <CallTriggerContext.Provider
      value={{
        audioTargetRef,
        videoTargetRef,
      }}
    >
      {children}
    </CallTriggerContext.Provider>
  );
};

export const useCallTrigger = () => useContext(CallTriggerContext);
