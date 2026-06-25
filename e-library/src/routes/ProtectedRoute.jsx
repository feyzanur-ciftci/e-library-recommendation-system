import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(UserContext);

  if (loading) return <div className="text-center mt-5">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" replace/>;  

  return children;
}
