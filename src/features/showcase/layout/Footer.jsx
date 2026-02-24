import { Link } from "react-router-dom";

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
    <footer
      id="contact"
      className="border-t border-border bg-gradient-to-b from-bg-secondary/70 to-bg-main/90"
    >
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="display-font font-bold text-2xl text-foreground leading-none">
                Modular Showcase<span className="text-accent">.</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Internal component library for building modular, reusable
              interfaces.
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Team: Modular Component Showcase</p>
              <p>Email: rushmanth21@gmail.com</p>
              <p>Phone: 9912387093</p>
              <p>LinkedIn: rushmanthnalluri</p>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
            <p className="text-sm text-muted-foreground">
              Copyright {currentYear} Modular Component Showcase. All rights
              reserved.
            </p>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Contact: rushmanth21@gmail.com | 9912387093 | LinkedIn:
            rushmanthnalluri
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
