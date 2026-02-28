import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/showcase/Header";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import warningIcon from "@/assets/showcase/warning.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const DEMO_USERNAME = "Rushmanth21@gmail.com";
const DEMO_PASSWORD = "1234";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));

    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const nextErrors = {
      username: data.username.trim() === "",
      password: data.password.trim() === "",
    };
    setErrors(nextErrors);

    const missingFields = [];
    if (nextErrors.username) {
      missingFields.push("Username");
    }
    if (nextErrors.password) {
      missingFields.push("Password");
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingFields = validateForm();
    if (missingFields.length > 0) {
      showMissingFieldToasts(missingFields);
      return;
    }

    try {
      setIsSubmitting(true);
      const inputUsername = data.username.trim();
      const inputPassword = data.password;

      if (inputUsername !== DEMO_USERNAME || inputPassword !== DEMO_PASSWORD) {
        throw new Error("Invalid username or password.");
      }

      localStorage.setItem("authToken", "demo-auth-token");
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          fullName: DEMO_USERNAME,
          username: DEMO_USERNAME,
        })
      );

      toast({
        title: "Login successful",
        description: (
          <span className="inline-flex items-center gap-2">
            <img src={successIcon} alt="" aria-hidden className="h-4 w-4" />
            Welcome back, {DEMO_USERNAME}.
          </span>
        ),
        duration: 4000,
      });

      navigate("/", { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: (
          <span className="inline-flex items-center gap-2">
            <img src={warningIcon} alt="" aria-hidden className="h-4 w-4" />
            {error.message}
          </span>
        ),
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
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
                type="text"
                name="username"
                value={data.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className={errors.username ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Enter your password"
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

            <div className="forgot-password">
              <button type="button" className="forgot-password-link">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Get Started"}
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
