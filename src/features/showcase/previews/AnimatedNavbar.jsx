import React, { Component } from "react";
import "./AnimatedNavbar.css";

class AnimatedNavbar extends Component {
  render() {
    const links = ["Home", "About", "Projects", "Contact"];

    return (
      <nav className="animated-navbar">
        {links.map((link) => (
          <a key={link} href="#" className="animated-navbar-link">
            {link}
          </a>
        ))}
      </nav>
    );
  }
}

export default AnimatedNavbar;
