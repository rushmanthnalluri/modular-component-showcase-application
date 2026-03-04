import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { subscribeToAuthUser } from "@/services/authAccess";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthUser((authUser) => {
      setIsAuthenticated(Boolean(authUser));
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;