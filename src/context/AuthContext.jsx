import React, { useState } from "react";
import { loginUser, registerUser } from "../services/authService";
import { AuthContext } from "./useAuth";
import { buildDemoStoreSession, normalizeStoreLoginResponse } from "../utils/demoSession";

const readStoredUser = () => {
  const userInfo = localStorage.getItem("userInfo");
  return userInfo ? JSON.parse(userInfo) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading] = useState(false);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      const session = normalizeStoreLoginResponse(data, email);
      setUser(session);
      localStorage.setItem("userInfo", JSON.stringify(session));
      return session;
    } catch {
      const fallback = buildDemoStoreSession(email);
      setUser(fallback);
      localStorage.setItem("userInfo", JSON.stringify(fallback));
      return fallback;
    }
  };

  const register = async (userData) => {
    try {
      const data = await registerUser(userData);
      const session = normalizeStoreLoginResponse(data, userData?.email);
      setUser(session);
      localStorage.setItem("userInfo", JSON.stringify(session));
      return session;
    } catch {
      const fallback = {
        ...buildDemoStoreSession(userData?.email),
        ...userData,
        role: userData.userType || "admin",
      };
      setUser(fallback);
      localStorage.setItem("userInfo", JSON.stringify(fallback));
      return fallback;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const updateProfile = (patch = {}) => {
    setUser((current) => {
      if (!current) return current;
      const firstName = patch.firstName ?? current.firstName ?? "";
      const lastName = patch.lastName ?? current.lastName ?? "";
      const composed = [firstName, lastName]
        .map((part) => String(part).trim())
        .filter(Boolean)
        .join(" ");
      const next = {
        ...current,
        ...patch,
        firstName,
        lastName,
        name: patch.name ?? (composed || current.name),
      };
      localStorage.setItem("userInfo", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
