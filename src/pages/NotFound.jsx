import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import "./NotFound.css";

const NotFound = () => {
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
