import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("smt_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.get("/api/auth/me");
      setUser(user);
    } catch {
      localStorage.removeItem("smt_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function login(email, password) {
    const { token, user } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("smt_token", token);
    setUser(user);
    return user;
  }

  async function register(payload) {
    const { token, user } = await api.post("/api/auth/register", payload);
    localStorage.setItem("smt_token", token);
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem("smt_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
