import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api/auth";
import { viderTout } from "../lib/cacheClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((res) => setUser(res.data.data))
      .catch(() => {
        // Jeton expiré ou invalide : on nettoie tout, y compris le cache
        localStorage.removeItem("token");
        viderTout();
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    viderTout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);