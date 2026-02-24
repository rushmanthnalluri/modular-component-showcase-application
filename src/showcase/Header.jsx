import { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const navLinks = [
  { name: "Components", to: "/#components" },
  { name: "Categories", to: "/#categories" },
  { name: "Contact", to: "/contact" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="layout-container app-header-content">
        <Link to="/" className="brand">
          Modular Showcase<span>.</span>
        </Link>

        <nav className="desktop-nav">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.to}>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="desktop-actions">
          <Link className="btn-outline" to="/login">
            Login
          </Link>
          <Link className="btn-dark" to="/register">
            Register
          </Link>
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
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)}>
              Register
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
