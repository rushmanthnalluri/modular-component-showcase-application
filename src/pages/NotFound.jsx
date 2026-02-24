import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "@/showcase";
import "./NotFound.css";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="notfound-page">
        <div className="notfound-box">
          <h1>404</h1>
          <p>Oops! Page not found.</p>
          <Link to="/">Return to Home</Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
