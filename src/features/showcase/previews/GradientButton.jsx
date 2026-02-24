import React, { Component } from "react";
import "./GradientButton.css";

class GradientButton extends Component {
  render() {
    const { children } = this.props;

    return <button className="gradient-button">{children}</button>;
  }
}

export default GradientButton;
