import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* A user is an admin when the Users sheet says so. Add a "role" column
   and put "admin" in it for the one account that manages the wheel. */
export function isAdmin(user) {
  return String(user?.role || "").trim().toLowerCase() === "admin";
}

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/home" replace />;

  return children;
}
