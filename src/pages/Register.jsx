import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/features/showcase/layout/Header";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import phoneIcon from "@/assets/showcase/phone.png";
import warningIcon from "@/assets/showcase/warning.png";
import errorIcon from "@/assets/showcase/error.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const initialFieldErrors = {
  fullName: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
};

const fieldLabels = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  password: "Password",
  confirmPassword: "Confirm password",
};

const Register = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }

      return {
        ...prev,
        [name]: value.trim() === "",
      };
    });

    if (name === "password" || name === "confirmPassword") {
      setPasswordMismatch(false);
    }
  };

  const validateRequiredFields = () => {
    const nextErrors = Object.entries(formData).reduce((acc, [field, value]) => {
      acc[field] = value.trim() === "";
      return acc;
    }, {});

    setFieldErrors(nextErrors);

    const missingFields = Object.entries(nextErrors)
      .filter(([, hasError]) => hasError)
      .map(([field]) => fieldLabels[field]);

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
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

    const { isValid, missingFields } = validateRequiredFields();

    if (!isValid) {
      showMissingFieldToasts(missingFields);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
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
      title: "Validation successful",
      description: (
        <span className="inline-flex items-center gap-2">
          <img src={successIcon} alt="" aria-hidden className="h-4 w-4" />
          Registration data is ready for processing.
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
                src={userIcon}
                alt=""
                aria-hidden
              />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className={fieldErrors.fullName ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={mailIcon} alt="" aria-hidden />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={fieldErrors.email ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={phoneIcon} alt="" aria-hidden />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={fieldErrors.phone ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={fieldErrors.password ? "error" : ""}
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
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={
                  fieldErrors.confirmPassword || passwordMismatch ? "error" : ""
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
