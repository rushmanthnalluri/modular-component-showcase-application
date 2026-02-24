import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/features/showcase/layout/Header";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import warningIcon from "@/assets/showcase/warning.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const initialFormData = {
  email: "",
  password: "",
};

const initialFieldErrors = {
  email: false,
  password: false,
};

const fieldLabels = {
  email: "Email",
  password: "Password",
};

const Login = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);
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

    toast({
      title: "Validation successful",
      description: (
        <span className="inline-flex items-center gap-2">
          <img src={successIcon} alt="" aria-hidden className="h-4 w-4" />
          Credentials are ready for authentication.
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
            <img src={userIcon} alt="User avatar" />
          </div>
          <h2>Sign in with email</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <img className="left-icon" src={mailIcon} alt="" aria-hidden />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={fieldErrors.email ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
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

            <div className="forgot-password">
              Forgot <span>Password</span>?
            </div>

            <button type="submit" className="auth-submit">
              Get Started
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
