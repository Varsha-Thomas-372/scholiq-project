import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export function ProtectedRoute({ role, children }: { role?: UserRole; children: JSX.Element }) {
  const { loading, user, profile } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-fg">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === "FACULTY" ? "/faculty" : "/home"} replace />;
  }
  return children;
}
