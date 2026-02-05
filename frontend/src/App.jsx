import { lazy, Suspense, useState } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";

import { AppContext } from "./context/Theme-Context.js";
import RouteLoader from "./components/Loader/RoutesLoader.jsx";

import GlobalCallHandler from "./components/GlobalCallHandler.jsx";
import GroupGlobalCallHandler from "./components/GroupGlobalCallHandler.jsx";
import { CallTriggerProvider } from "./context/CallTriggerContext.jsx";

/* ================= LAZY PAGES ================= */

const Home = lazy(() => import("./pages/Users/Home/Home.jsx"));
const Login = lazy(() => import("./pages/Users/Login.jsx"));
const SignUp = lazy(() => import("./pages/Users/SignUp.jsx"));
const ForgetPassword = lazy(() => import("./pages/Users/ForgetPassword.jsx"));

const Messages = lazy(() =>
  import("./pages/Users/messages/Messages.jsx")
);
const GroupsMessages = lazy(() =>
  import("./pages/Users/groupMessages/GroupsMessages.jsx")
);

const Calls = lazy(() => import("./pages/Users/Calling.jsx"));
const Profile = lazy(() => import("./pages/Users/Profile.jsx"));

/* ================= APP ================= */

const App = () => {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState(null);

  return (
    <AppContext.Provider value={{ isDark, setIsDark, user, setUser }}>
      <div
        className={`min-h-screen w-full transition-colors duration-300 ${
          isDark ? "bg-darkmode text-lightmode" : "bg-lightmode text-darkmode"
        }`}
      >
        <Router>
          <CallTriggerProvider>
            {/* 🔌 GLOBAL CALL HANDLERS (ALWAYS MOUNTED) */}
            <GlobalCallHandler />
            <GroupGlobalCallHandler />

            {/* 🚦 ROUTE-LEVEL LOADER ONLY */}
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/forgetPassword"
                  element={<ForgetPassword />}
                />

                <Route path="/messages" element={<Messages />} />
                <Route path="/groups" element={<GroupsMessages />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </CallTriggerProvider>
        </Router>
      </div>
    </AppContext.Provider>
  );
};

export default App;
