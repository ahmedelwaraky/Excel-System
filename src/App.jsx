// App.jsx
import { useState, useEffect, useCallback } from "react";
// import LoginPage     from "./pages/LoginPage/LoginPage";
// import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
// import Home          from "./pages/Home/Home";
import LoadingScreen from "./modules/components/LoadingScreen";
import LoginPage from "./modules/Auth/page/LoginPage";
import Home from "./modules/page/Home";

export default function App() {
  // "login" | "loading" | "home"
  const [screen, setScreen] = useState("login");
  const [user,   setUser]   = useState(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("excel_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setScreen("home"); // already logged in → skip loading
      }
    } catch {
      localStorage.removeItem("excel_user");
    }
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setScreen("loading"); // show loading screen
  }

  const handleLoadingDone = useCallback(() => {
    setScreen("home");
  }, []);

  function handleLogout() {
    localStorage.removeItem("excel_user");
    setUser(null);
    setScreen("login");
  }

  if (screen === "login")   return <LoginPage onLogin={handleLogin} />;
  if (screen === "loading") return <LoadingScreen user={user} onDone={handleLoadingDone} />;
  return <Home currentUser={user} onLogout={handleLogout} />;
}