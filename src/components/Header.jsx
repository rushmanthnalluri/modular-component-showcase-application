import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("authToken")));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setIsAuthenticated(false);
    setIsMenuOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  return (
    <header className="app-header">
      <div className="layout-container app-header-content">
        <Link to="/" className="brand">
          Modular Showcase<span>.</span>
        </Link>

        <div className="desktop-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              className="btn-dark"
              onClick={handleLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          ) : (
            <>
              <Link className="btn-outline" to="/login">
                Login
              </Link>
              <Link className="btn-dark" to="/register">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? "X" : "Menu"}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="mobile-nav-wrap">
          <div className="layout-container mobile-nav">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? "Light Theme" : "Dark Theme"}
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                className="btn-dark"
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default React.memo(Header);
