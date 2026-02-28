import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/showcase/Header";
import userIcon from "@/assets/showcase/user.png";
import userdarkIcon from "@/assets/showcase/user dark.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import phoneIcon from "@/assets/showcase/phone.png";
import warningIcon from "@/assets/showcase/warning.png";
import errorIcon from "@/assets/showcase/error.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const Register = () => {
  const { toast } = useToast();
  const [data, setData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setData((prev) => ({ ...prev, [name]: value }));
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }

    if (name === "password" || name === "confirmPassword") {
      setPasswordMismatch(false);
    }
  };

  const validateForm = () => {
    const nextErrors = {
      fullName: data.fullName.trim() === "",
      email: data.email.trim() === "",
      phone: data.phone.trim() === "",
      password: data.password.trim() === "",
      confirmPassword: data.confirmPassword.trim() === "",
    };
    setErrors(nextErrors);

    const missingFields = [];
    if (nextErrors.fullName) {
      missingFields.push("Full name");
    }
    if (nextErrors.email) {
      missingFields.push("Email");
    }
    if (nextErrors.phone) {
      missingFields.push("Phone");
    }
    if (nextErrors.password) {
      missingFields.push("Password");
    }
    if (nextErrors.confirmPassword) {
      missingFields.push("Confirm password");
    }

    return missingFields;
  };

  const showMissingFieldToasts = (missingFields) => {
    missingFields.forEach((fieldName) => {
      toast({
        title: `${fieldName} is required`,
        description: (
          <span className="inline-flex items-center gap-2">
            <img src={warningIcon} alt="" aria-hidden className="h-4 w-4" />
            Please enter your {fieldName.toLowerCase()}.
          </span>
        ),
        duration: 4000,
      });
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const missingFields = validateForm();
    if (missingFields.length > 0) {
      showMissingFieldToasts(missingFields);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setPasswordMismatch(true);
      toast({
        title: "Password mismatch",
        description: (
          <span className="inline-flex items-center gap-2">
            <img src={errorIcon} alt="" aria-hidden className="h-4 w-4" />
            Password and confirm password should be the same.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    toast({
      title: "Demo registration successful",
      description: (
        <span className="inline-flex items-center gap-2">
          <img src={successIcon} alt="" aria-hidden className="h-4 w-4" />
          Frontend demo only. Use Rushmanth / 1234 to login.
        </span>
      ),
      duration: 4000,
    });
  };

  return (
    <>
      <Header />
      <div className="auth-page with-navbar">
        <div className="auth-card">
          <div className="auth-avatar">
            <img src={userIcon} alt="Registration avatar" />
          </div>
          <h2>Create Account</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <img
                className="left-icon"
                src={userdarkIcon}
                alt=""
                aria-hidden
              />
              <input
                type="text"
                name="fullName"
                value={data.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className={errors.fullName ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={mailIcon} alt="" aria-hidden />
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Email"
                className={errors.email ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={phoneIcon} alt="" aria-hidden />
              <input
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={errors.phone ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Password"
                className={errors.password ? "error" : ""}
              />
              <button
                type="button"
                className="icon-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <img className="right-icon" src={eyeIcon} alt="" aria-hidden />
              </button>
            </div>

            <div className="input-group">
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                type="password"
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={
                  errors.confirmPassword || passwordMismatch ? "error" : ""
                }
              />
            </div>

            <button type="submit" className="auth-submit">
              Register
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login Here</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
