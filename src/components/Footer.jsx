import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const quickLinks = [
  { name: "Home", to: "/" },
  { name: "Components", to: "/#components" },
  { name: "Contact", to: "/contact" },
  { name: "Help", to: "/help" },
];

const supportLinks = [
  { name: "Privacy", to: "/privacy" },
  { name: "Terms", to: "/terms" },
  { name: "Contact Team", to: "/contact" },
  { name: "Help", to: "/help" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" id="contact">
      <div className="footer-shell">
        <div className="footer-main" role="presentation">
          <section className="footer-section footer-left" aria-label="Footer brand and contact">
            <Link to="/" className="footer-brand">
              Modular Showcase<span>.</span>
            </Link>
            <p className="footer-description">
              Internal component library for building modular and reusable user
              interfaces.
            </p>
            <div className="footer-contact">
              <p>Team: Modular Component Showcase</p>
              <p>
                Email:{" "}
                <a href="mailto:rushmanth21@gmail.com">rushmanth21@gmail.com</a>
              </p>
              <p>
                Phone: <a href="tel:+919912387093">9912387093</a>
              </p>
            </div>
          </section>

          <nav className="footer-section footer-center" aria-label="Quick links">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.to}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-section footer-right" aria-label="Support links">
            <h4>Support</h4>
            <ul>
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.to}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>
            Copyright {currentYear} Modular Component Showcase. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
