import {
  FileText,
  MessageSquare,
  MousePointerClick,
  Navigation,
  Package,
  Palette,
} from "lucide-react";
import animatedNavbarThumb from "@/assets/showcase/animated-navbar.svg";
import animatedNavbarScreenshot from "@/assets/showcase/animated-navbar-screenshot.svg";
import glassCardThumb from "@/assets/showcase/glass-card.svg";
import glassCardScreenshot from "@/assets/showcase/glass-card-preview.svg";
import gradientButtonThumb from "@/assets/showcase/gradient-button.svg";
import gradientButtonScreenshot from "@/assets/showcase/gradient-button-screenshot.svg";
import neonInputThumb from "@/assets/showcase/neon-input.svg";
import neonInputScreenshot from "@/assets/showcase/neon-input-screenshot.svg";
import profileCardThumb from "@/assets/showcase/profile-card.svg";
import profileCardScreenshot from "@/assets/showcase/profile-card-screenshot.svg";
import toastNotificationThumb from "@/assets/showcase/toast-notification.svg";
import toastNotificationScreenshot from "@/assets/showcase/toast-notification-screenshot.svg";

export const categories = [
  { id: "all", name: "All Components", icon: Palette },
  { id: "buttons", name: "Buttons", icon: MousePointerClick },
  { id: "cards", name: "Cards", icon: Package },
  { id: "forms", name: "Forms", icon: FileText },
  { id: "navigation", name: "Navigation", icon: Navigation },
  { id: "feedback", name: "Feedback", icon: MessageSquare },
];

export const components = [
  {
    id: "gradient-button",
    name: "Gradient Button",
    description: "Animated gradient call-to-action button with hover scaling.",
    category: "buttons",
    tags: ["button", "gradient", "animated"],
    thumbnail: gradientButtonThumb,
    screenshot: gradientButtonScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
import "./GradientButton.css";

class GradientButton extends Component {
  render() {
    const { children } = this.props;

    return <button className="gradient-button">{children}</button>;
  }
}

export default GradientButton;`,
      css: `.gradient-button {
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-size: 11pt;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  background: linear-gradient(90deg, #0d9488, #0891b2, #f97316);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.22);
  transition: transform 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease;
}

.gradient-button:hover {
  transform: scale(1.05);
  filter: brightness(0.95);
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.3);
}`,
    },
  },
  {
    id: "glass-card",
    name: "Glass Card",
    description: "Glassmorphism card with blur, border glow, and clean typography.",
    category: "cards",
    tags: ["card", "glassmorphism", "ui"],
    thumbnail: glassCardThumb,
    screenshot: glassCardScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
import "./GlassCard.css";

class GlassCard extends Component {
  render() {
    const { title, description } = this.props;

    return (
      <div className="glass-card">
        <h3 className="glass-card-title">{title}</h3>
        <p className="glass-card-description">{description}</p>
      </div>
    );
  }
}

export default GlassCard;`,
      css: `.glass-card {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid #fed7aa;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.9);
}

.glass-card-title {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 16pt;
}

.glass-card-description {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}`,
    },
  },
  {
    id: "neon-input",
    name: "Neon Input",
    description: "Dark input field with neon focus ring and glowing border.",
    category: "forms",
    tags: ["input", "form", "neon"],
    thumbnail: neonInputThumb,
    screenshot: neonInputScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
import "./NeonInput.css";

class NeonInput extends Component {
  render() {
    const { placeholder } = this.props;

    return <input type="text" placeholder={placeholder} className="neon-input" />;
  }
}

export default NeonInput;`,
      css: `.neon-input {
  width: 100%;
  max-width: 400px;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px 16px;
  outline: none;
  transition: all 0.3s ease;
}

.neon-input::placeholder {
  color: #64748b;
}

.neon-input:focus {
  border-color: #fb923c;
  box-shadow:
    0 0 0 2px rgba(251, 146, 60, 0.2),
    0 0 24px rgba(249, 115, 22, 0.25);
}`,
    },
  },
  {
    id: "animated-navbar",
    name: "Animated Navbar",
    description: "Rounded navigation bar with animated underline interactions.",
    category: "navigation",
    tags: ["navbar", "navigation", "animated"],
    thumbnail: animatedNavbarThumb,
    screenshot: animatedNavbarScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
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

export default AnimatedNavbar;`,
      css: `.animated-navbar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  padding: 14px 28px;
  border-radius: 999px;
  border: 1px solid #334155;
  background: rgba(15, 23, 42, 0.9);
}

.animated-navbar-link {
  color: #94a3b8;
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;
}

.animated-navbar-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0;
  height: 2px;
  background: #fb923c;
  transition: width 0.3s ease;
}

.animated-navbar-link:hover {
  color: #fdba74;
}

.animated-navbar-link:hover::after {
  width: 100%;
}`,
    },
  },
  {
    id: "toast-notification",
    name: "Toast Notification",
    description: "Status toast with success, error, and info visual variants.",
    category: "feedback",
    tags: ["toast", "notification", "feedback"],
    thumbnail: toastNotificationThumb,
    screenshot: toastNotificationScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
import "./ToastNotification.css";

class ToastNotification extends Component {
  render() {
    const { message, type = "success" } = this.props;
    const colors = {
      success: "toast-notification-success",
      error: "toast-notification-error",
      info: "toast-notification-info",
    };
    const variantClass = colors[type] || colors.success;

    return (
      <div className={"toast-notification " + variantClass}>
        <p>{message}</p>
      </div>
    );
  }
}

export default ToastNotification;`,
      css: `.toast-notification {
  padding: 14px 24px;
  border-radius: 10px;
  border: 1px solid transparent;
  backdrop-filter: blur(6px);
}

.toast-notification p {
  margin: 0;
  font-weight: 600;
}

.toast-notification-success {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #d1fae5;
}

.toast-notification-error {
  background: rgba(239, 68, 68, 0.2);
  border-color: #f87171;
  color: #fecaca;
}

.toast-notification-info {
  background: rgba(6, 182, 212, 0.2);
  border-color: #22d3ee;
  color: #cffafe;
}`,
    },
  },
  {
    id: "profile-card",
    name: "Profile Card",
    description: "Team profile card with gradient avatar and skill chips.",
    category: "cards",
    tags: ["profile", "card", "team"],
    thumbnail: profileCardThumb,
    screenshot: profileCardScreenshot,
    code: {
      jsx: `import React, { Component } from "react";
import profileAvatar from "@/assets/showcase/profile-avatar.svg";
import "./ProfileCard.css";

class ProfileCard extends Component {
  render() {
    const skills = ["React", "Vite", "Tailwind"];

    return (
      <div className="profile-card">
        <div className="profile-card-avatar-wrapper">
          <img src={profileAvatar} alt="Profile avatar" className="profile-card-avatar" />
        </div>
        <h3 className="profile-card-title">Team Member</h3>
        <p className="profile-card-role">UI Component Engineer</p>
        <div className="profile-card-skills">
          {skills.map((skill) => (
            <button key={skill} className="profile-card-skill">
              {skill}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default ProfileCard;`,
      css: `.profile-card {
  width: 288px;
  border-radius: 18px;
  padding: 24px;
  text-align: center;
  color: #ffffff;
  border: 1px solid #334155;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}

.profile-card-avatar-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px auto;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 10px 16px rgba(15, 23, 42, 0.35);
}

.profile-card-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-card-title {
  margin: 0;
  font-size: 16pt;
}

.profile-card-role {
  margin: 8px 0 16px 0;
  color: #94a3b8;
}

.profile-card-skills {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-card-skill {
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  background: #334155;
  color: #cbd5e1;
  transition: all 0.25s ease;
}

.profile-card-skill:hover {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.2);
}`,
    },
  },
];
