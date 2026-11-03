"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type Role, type User } from "./api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    nama: string,
    email: string,
    password: string,
    role: Role,
    kodeAdmin?: string
  ) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (raw && token) setUser(JSON.parse(raw));
    } catch {
      localStorage.clear();
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (nama: string, email: string, password: string, role: Role, kodeAdmin?: string) => {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({ nama, email, password, role, kode_admin: kodeAdmin }),
      });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return c;
}

// Melindungi halaman: redirect jika belum login / role tidak sesuai
export function useGuard(role?: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (role && user.role !== role) router.replace("/");
  }, [loading, user, role, router]);

  const ready = !loading && !!user && (!role || user.role === role);
  return { user, ready };
}