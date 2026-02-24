import { Link } from "react-router-dom";
import "./Footer.css";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { name: "All Components", to: "/#components" },
      { name: "Buttons", to: "/#categories" },
      { name: "Cards", to: "/#categories" },
      { name: "Forms", to: "/#categories" },
      { name: "Navigation", to: "/#categories" },
    ],
  },
  {
    title: "Project",
    links: [
      { name: "Home", to: "/" },
      { name: "Components", to: "/#components" },
      { name: "Code Previews", to: "/#components" },
      { name: "Get in Touch", to: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Contact Team", to: "/contact" },
      { name: "Privacy", to: "/" },
      { name: "Terms", to: "/" },
      { name: "Help", to: "/" },
    ],
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" id="contact">
      <div className="layout-container footer-content">
        <div className="footer-top">
          <div className="footer-about">
            <Link to="/" className="footer-brand">
              Modular Showcase<span>.</span>
            </Link>
            <p>
              Internal component library for building modular and reusable user
              interfaces.
            </p>
            <div className="footer-contact">
              <p>Team: Modular Component Showcase</p>
              <p>Email: rushmanth21@gmail.com</p>
              <p>Phone: 9912387093</p>
              <p>LinkedIn: rushmanthnalluri</p>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div className="footer-section" key={section.title}>
              <h4>{section.title}</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.to}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>
            Copyright {currentYear} Modular Component Showcase. All rights
            reserved.
          </p>
          <p>Contact: rushmanth21@gmail.com | 9912387093</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
