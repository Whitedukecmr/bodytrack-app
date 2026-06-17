import { useState, useEffect } from "react";
import { api, getToken } from "./api";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (getToken()) {
        try {
          const me = await api.me();
          setUser(me);
        } catch (e) {
          // token invalide/expiré, on reste sur la page de login
        }
      }
      setChecking(false);
    }
    checkAuth();
  }, []);

  if (checking) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Chargement...</div>;

  if (!user) return <AuthPage onAuth={setUser} />;

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
