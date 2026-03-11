import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { APIURL } from "@/lib";
import "./Layout.css";

const Layout = ({ children }) => {
  const [memoryMode, setMemoryMode] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetch(`${APIURL}/health`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.mode === "memory") setMemoryMode(true);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="layout-page">
      {memoryMode && !bannerDismissed && (
        <div className="memory-mode-banner" role="alert">
          <span>
            <strong>Demo mode active:</strong> The server is using temporary in-memory storage.
            Your account will be lost if the server restarts. Simply re-register to continue.
          </span>
          <button
            className="memory-mode-banner-close"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}
      <Header />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
