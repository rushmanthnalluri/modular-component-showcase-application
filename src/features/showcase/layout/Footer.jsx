import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { name: "All Components", href: "/#components" },
      { name: "Buttons", href: "/#categories" },
      { name: "Cards", href: "/#categories" },
      { name: "Forms", href: "/#categories" },
      { name: "Navigation", href: "/#categories" },
    ],
  },
  {
    title: "Project",
    links: [
      { name: "Home", href: "/" },
      { name: "Components", href: "/#components" },
      { name: "Code Previews", href: "/#components" },
      { name: "Get in Touch", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Contact Team", href: "/contact" },
      { name: "Privacy", href: "/" },
      { name: "Terms", href: "/" },
      { name: "Help", href: "/" },
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
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
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
