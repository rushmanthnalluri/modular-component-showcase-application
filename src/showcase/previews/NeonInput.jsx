import React, { Component } from "react";
import "./NeonInput.css";

class NeonInput extends Component {
  render() {
    const { placeholder } = this.props;

    return (
      <input type="text" placeholder={placeholder} className="neon-input" />
    );
  }
}

export default NeonInput;
