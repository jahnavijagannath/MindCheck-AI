import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("mindcheck_token");
    const storedUser = localStorage.getItem("mindcheck_user");

    if (storedToken) {
      setToken(storedToken);
      setAuthTokenGetter(() => localStorage.getItem("mindcheck_token"));
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("mindcheck_user");
      }
    }

    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log("Saving token:", newToken);

    localStorage.setItem("mindcheck_token", newToken);
    localStorage.setItem("mindcheck_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    setAuthTokenGetter(() => localStorage.getItem("mindcheck_token"));
  };

  const logout = () => {
    localStorage.removeItem("mindcheck_token");
    localStorage.removeItem("mindcheck_user");

    setToken(null);
    setUser(null);

    setAuthTokenGetter(() => null);
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}