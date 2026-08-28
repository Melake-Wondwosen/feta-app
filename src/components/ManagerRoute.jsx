import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Set role to "manager" on the Users sheet, and put the division name in
   the "region" column. BAs in the same region share that value. */
export function isManager(user) {
  return String(user?.role || "").trim().toLowerCase() === "manager";
}

export default function ManagerRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!isManager(user)) return <Navigate to="/home" replace />;

  return children;
}
