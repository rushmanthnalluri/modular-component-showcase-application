import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import {
  canAccessAddComponent,
  logoutUser,
  subscribeToAuthUser,
} from "@/services/authAccess";
import lightModeIcon from "@/assets/theme/light-mode.svg";
import darkModeIcon from "@/assets/theme/dark-mode.svg";
import "./header.css";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserRole, setAuthUserRole] = useState("");
  const [canAddComponent, setCanAddComponent] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = subscribeToAuthUser((authUser) => {
      setIsAuthenticated(Boolean(authUser));
      setAuthUserRole(String(authUser?.role || "").toLowerCase());
      setCanAddComponent(canAccessAddComponent(authUser));
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setAuthUserRole("");
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
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 8);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header className={`app-header ${isScrolled ? "app-header--scrolled" : ""}`}>
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
              <Link className="btn-outline" to="/user/dashboard">
                Profile
              </Link>
              {canAddComponent ? (
                <Link className="btn-outline" to="/developer/dashboard">
                  Developer Dashboard
                </Link>
              ) : null}
              {canAddComponent ? (
                <Link className="btn-outline" to="/add-component">
                  Add Component
                </Link>
              ) : null}
              {authUserRole === "admin" ? (
                <Link className="btn-outline" to="/admin/sql">
                  SQL Admin
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
              <Link className="btn-dark btn-register" to="/register">
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
                <Link to="/user/dashboard" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
                {canAddComponent ? (
                  <Link to="/developer/dashboard" onClick={() => setIsMenuOpen(false)}>
                    Developer Dashboard
                  </Link>
                ) : null}
                {canAddComponent ? (
                  <Link to="/add-component" onClick={() => setIsMenuOpen(false)}>
                    Add Component
                  </Link>
                ) : null}
                {authUserRole === "admin" ? (
                  <Link to="/admin/sql" onClick={() => setIsMenuOpen(false)}>
                    SQL Admin
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
