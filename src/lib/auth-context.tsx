"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, setToken, clearToken, clearWorkspaceId } from "./api";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => void;
  setSession: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("pitret_token") : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("pitret_token") : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/auth/profile")
      .then((profile) => setUser(profile))
      .catch(() => {
        clearToken();
        clearWorkspaceId();
        setTokenState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = (u: AuthUser) => {
    if (u.accessToken) {
      setToken(u.accessToken);
      setTokenState(u.accessToken);
    }
    const { accessToken: _tok, ...rest } = u;
    setUser(rest);
  };

  const login = async (emailOrPhone: string, password: string) => {
    const payload = emailOrPhone.includes("@")
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password };
    const result = await api.post<AuthUser>("/auth/login", payload);
    setSession(result);
  };

  const logout = () => {
    clearToken();
    clearWorkspaceId();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
