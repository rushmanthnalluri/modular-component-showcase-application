import React from "react";
import { Link } from "react-router-dom";
import { APP_INFO } from "@/data/app.constants";
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
  { name: "Contact", to: "/contact" },
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
              {APP_INFO.shortName}<span>.</span>
            </Link>
            <p className="footer-description">
              Internal component library for building modular and reusable user
              interfaces.
            </p>
            <div className="footer-contact">
              <p>
                <span className="footer-contact-label">Email:</span>
                <span className="footer-contact-value">
                  <a href={`mailto:${APP_INFO.supportEmail}`}>{APP_INFO.supportEmail}</a>
                </span>
              </p>
              <p>
                <span className="footer-contact-label">Phone:</span>
                <span className="footer-contact-value">
                  <a href={`tel:${APP_INFO.supportPhoneRaw}`}>
                    {APP_INFO.supportPhoneDisplay}
                  </a>
                </span>
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
            Copyright {currentYear} {APP_INFO.fullName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
