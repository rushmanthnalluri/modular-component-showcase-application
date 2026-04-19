import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const DeveloperRoute = ({ children }) => {
  const { isLoading, isLoggedIn, canAddComponent } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!canAddComponent) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DeveloperRoute;
