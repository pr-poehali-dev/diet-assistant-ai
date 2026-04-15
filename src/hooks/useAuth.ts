import { useState, useEffect, useCallback } from "react";
import { apiMe, apiLogin, apiRegister, apiLogout, setToken, clearToken } from "@/lib/api";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiMe().then((u) => {
      setUser(u || null);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const data = await apiLogin(email, password);
    if (data.error) return data.error;
    setToken(data.token);
    setUser({ id: data.id, email: data.email, name: data.name });
    return null;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<string | null> => {
    const data = await apiRegister(email, password, name);
    if (data.error) return data.error;
    setToken(data.token);
    setUser({ id: data.id, email: data.email, name: data.name });
    return null;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearToken();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
