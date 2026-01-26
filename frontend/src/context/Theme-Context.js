import { createContext } from "react";

export const AppContext = createContext({
  isDark: false,
  setIsDark: () => {},
});
