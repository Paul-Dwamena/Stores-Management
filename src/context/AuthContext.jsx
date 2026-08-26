import React, { useEffect, useState } from "react";
import { getMe, loginUser } from "../services/authService";
import { AuthContext } from "./useAuth";

const readStoredUser = () => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    localStorage.removeItem("userInfo");
    return null;
  }
};

const persist = (session) => {
  if (session) localStorage.setItem("userInfo", JSON.stringify(session));
  else localStorage.removeItem("userInfo");
  return session;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const applyProfile = (profile) => {
    setUser((current) => persist({ ...current, ...profile, token: current?.token }));
  };

  const logout = () => {
    setUser(null);
    persist(null);
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!readStoredUser()?.token) return;
      try {
        applyProfile(await getMe());
      } catch (err) {
        if (err?.response?.status === 401 || err?.status === 401) {
          logout();
        }
      }
    };

    hydrate();
    const onExpired = () => logout();
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  const login = async (email, password) => {
    const session = persist(await loginUser(email, password));
    setUser(session);
    try {
      applyProfile(await getMe());
    } catch {
      // keep the login session if /me fails
    }
    return session;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, applyProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
