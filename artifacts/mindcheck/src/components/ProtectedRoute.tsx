import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || !user) {
      setLocation("/login");
    } else if (adminOnly && !user.is_admin) {
      setLocation("/dashboard");
    }
  }, [token, user, setLocation, adminOnly]);

  if (!token || !user || (adminOnly && !user.is_admin)) {
    return null;
  }

  return <>{children}</>;
}
