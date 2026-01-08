import React, { useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Users/Home.jsx";
import Login from "./pages/Users/Login.jsx";
import SignUp from "./pages/Users/SignUp.jsx";
import { AppContext } from "./context/Theme-Context.js";
import ForgetPassword from "./pages/Users/ForgetPassword.jsx";

const App = () => {
  const [isDark, setIsDark] = useState(false); // GLOBAL STATE

  return (
    <Router>
      <AppContext.Provider value={{ isDark, setIsDark }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgetPassword" element={<ForgetPassword/>} />
        </Routes>
      </AppContext.Provider>
    </Router>
  );
};

export default App;
