import { useState } from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Home from "./modules/page/Home";
import LoginPage from "./modules/Auth/page/LoginPage";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("excel_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("excel_user");
    setUser(null);
  }

  // مش مسجّل → LoginPage مباشرةً بدون routing
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home currentUser={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}