import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

/* Per-user data that must not survive into the next person's session.
   These phones get shared between BAs, so signing out has to leave the
   device clean rather than relying on the next user's id not colliding. */
const PER_USER_PREFIXES = [
  "outlets_",
  "campaign_",
  "bottle_pool_",
  "spin_done_",
];

function clearPerUserData() {
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && PER_USER_PREFIXES.some((p) => key.startsWith(p))) {
      doomed.push(key);
    }
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    /* If a different person used this device last, drop their cached
       outlets and campaigns before the new session starts. */
    let previous = null;
    try {
      previous = JSON.parse(localStorage.getItem("user"));
    } catch {
      previous = null;
    }
    if (previous && String(previous.id) !== String(userData?.id)) {
      clearPerUserData();
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    clearPerUserData();
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
