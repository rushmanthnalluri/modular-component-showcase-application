import React, { Component } from "react";
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

export default ToastNotification;
