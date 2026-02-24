import React, { Component } from "react";
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

export default GlassCard;
