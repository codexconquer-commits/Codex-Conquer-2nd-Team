import { useState } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";

import { AppContext } from "./context/Theme-Context.js";

import ForgetPassword from "./pages/Users/ForgetPassword.jsx";
import Home from "./pages/Users/Home.jsx";
import Login from "./pages/Users/Login.jsx";
import SignUp from "./pages/Users/SignUp.jsx";
import Messages from "./pages/Users/Messages.jsx";
import Calls from "./pages/Users/Calling.jsx";
import Profile from "./pages/Users/Profile.jsx";
import Notifications from "./pages/Users/Notification.jsx"; // ✅ FIX

const App = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <Router>
      <AppContext.Provider value={{ isDark, setIsDark }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgetPassword" element={<ForgetPassword />} />

          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AppContext.Provider>
    </Router>
  );
};

export default App;
