import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/components/Header";
import { registerUser } from "@/services/authAccess";
import userIcon from "@/assets/showcase/user.png";
import userdarkIcon from "@/assets/showcase/user dark.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import phoneIcon from "@/assets/showcase/phone.png";
import warningIcon from "@/assets/showcase/warning.png";
import loadingIcon from "@/assets/showcase/loading.svg";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const PHONE_DIGITS_REGEX = /^\d{10,15}$/;

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Controlled form pattern: all input values are sourced from React state.
  const [data, setData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    role: false,
  });
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 15) : value;

    setData((prev) => ({ ...prev, [name]: nextValue }));
    if (nextValue.trim() !== "") {
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
      role: !["developer", "user"].includes(data.role),
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
    if (nextErrors.role) {
      missingFields.push("Account type");
    }

    return missingFields;
  };

  const showMissingFieldToasts = (missingFields) => {
    missingFields.forEach((fieldName) => {
      toast({
        title: `${fieldName} is required`,
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            Please enter your {fieldName.toLowerCase()}.
          </span>
        ),
        duration: 4000,
      });
    });
  };

  const handleSubmit = async (event) => {
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
          <span className="toast-inline">
            <img src={loadingIcon} alt="" aria-hidden className="toast-inline-icon" />
            Password and confirm password should be the same.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    if (!PHONE_DIGITS_REGEX.test(data.phone.trim())) {
      setErrors((prev) => ({ ...prev, phone: true }));
      toast({
        title: "Invalid phone number",
        description: (
          <span className="toast-inline">
            <img src={loadingIcon} alt="" aria-hidden className="toast-inline-icon" />
            Phone number must contain 10 to 15 digits only.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      });

      toast({
        title: "Registration successful",
        description: (
          <span className="toast-inline">
            <img src={successIcon} alt="" aria-hidden className="toast-inline-icon" />
            Account created as {data.role}. Please login to continue.
          </span>
        ),
        duration: 4000,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (
          <span className="toast-inline">
            <img src={loadingIcon} alt="" aria-hidden className="toast-inline-icon" />
            {error.message}
          </span>
        ),
        duration: 4000,
      });
    }
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
              <label htmlFor="register-full-name" className="sr-only">
                Full Name
              </label>
              <img
                className="left-icon"
                src={userdarkIcon}
                alt=""
                aria-hidden
              />
              <input
                id="register-full-name"
                type="text"
                name="fullName"
                value={data.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className={errors.fullName ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-email" className="sr-only">
                Email
              </label>
              <img className="left-icon" src={mailIcon} alt="" aria-hidden />
              <input
                id="register-email"
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={errors.email ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-phone" className="sr-only">
                Phone
              </label>
              <img className="left-icon" src={phoneIcon} alt="" aria-hidden />
              <input
                id="register-phone"
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="9876543210"
                inputMode="numeric"
                pattern="[0-9]{10,15}"
                maxLength={15}
                className={errors.phone ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-role" className="sr-only">
                Account Type
              </label>
              <select
                id="register-role"
                name="role"
                value={data.role}
                onChange={handleChange}
                className={errors.role ? "error" : ""}
              >
                <option value="user">User</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="register-password" className="sr-only">
                Password
              </label>
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                id="register-password"
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
              <label htmlFor="register-confirm-password" className="sr-only">
                Confirm Password
              </label>
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                id="register-confirm-password"
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

            <button
              type="submit"
              className="auth-submit"
              aria-label="Submit registration form"
            >
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
