import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  canAccessAddComponent,
  logoutUser,
  subscribeToAuthUser,
} from "@/services/authAccess";
import lightModeIcon from "@/assets/theme/light-mode.svg";
import darkModeIcon from "@/assets/theme/dark-mode.svg";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canAddComponent, setCanAddComponent] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = subscribeToAuthUser((authUser) => {
      setIsAuthenticated(Boolean(authUser));
      setCanAddComponent(canAccessAddComponent(authUser));
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setCanAddComponent(false);
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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
            aria-pressed={theme === "dark"}
          >
            <img
              className="theme-toggle-icon"
              src={theme === "dark" ? lightModeIcon : darkModeIcon}
              alt=""
              aria-hidden="true"
            />
          </button>
          {isAuthenticated ? (
            <>
              {canAddComponent ? (
                <Link className="btn-outline" to="/add-component">
                  Add Component
                </Link>
              ) : null}
              <button
                type="button"
                className="btn-dark"
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            </>
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
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? "X" : "Menu"}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="mobile-nav-wrap" id="mobile-navigation">
          <nav className="layout-container mobile-nav" aria-label="Mobile navigation">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              aria-pressed={theme === "dark"}
            >
              <img
                className="theme-toggle-icon"
                src={theme === "dark" ? lightModeIcon : darkModeIcon}
                alt=""
                aria-hidden="true"
              />
            </button>
            {isAuthenticated ? (
              <>
                {canAddComponent ? (
                  <Link to="/add-component" onClick={() => setIsMenuOpen(false)}>
                    Add Component
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="btn-dark"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
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
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default React.memo(Header);
