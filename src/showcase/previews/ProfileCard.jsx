import profileAvatar from "@/assets/showcase/profile-avatar.svg";
import React, { Component } from "react";
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

export default ProfileCard;
