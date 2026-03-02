import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/components/Header";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import warningIcon from "@/assets/showcase/warning.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const DEMO_EMAIL = "Rushmanth21@gmail.com";
const DEMO_PASSWORD = "1234";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Controlled inputs: React state is the single source of truth.
  const [data, setData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Uncontrolled comparison: optional field managed via ref (not part of re-render state).
  const referenceCodeRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));

    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const nextErrors = {
      email: data.email.trim() === "",
      password: data.password.trim() === "",
    };
    setErrors(nextErrors);

    const missingFields = [];
    if (nextErrors.email) {
      missingFields.push("Email");
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

    try {
      setIsSubmitting(true);
      const inputEmail = data.email.trim();
      const inputPassword = data.password;
      const referenceCode = referenceCodeRef.current?.value.trim() || "";

      if (inputEmail !== DEMO_EMAIL || inputPassword !== DEMO_PASSWORD) {
        throw new Error("Invalid username or password.");
      }

      localStorage.setItem("authToken", "demo-auth-token");
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          fullName: DEMO_EMAIL,
          email: DEMO_EMAIL,
          referenceCode,
        })
      );

      toast({
        title: "Login successful",
        description: (
          <span className="toast-inline">
            <img src={successIcon} alt="" aria-hidden className="toast-inline-icon" />
            Welcome back, {DEMO_EMAIL}.
          </span>
        ),
        duration: 4000,
      });

      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
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
              <label htmlFor="login-email" className="sr-only">
                Email
              </label>
              <img className="left-icon" src={mailIcon} alt="" aria-hidden />
              <input
                id="login-email"
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? "error" : ""}
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password" className="sr-only">
                Password
              </label>
              <img className="left-icon" src={lockIcon} alt="" aria-hidden />
              <input
                id="login-password"
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

            <label htmlFor="login-reference-code" className="sr-only">
              Reference Code (Optional)
            </label>
            <input
              id="login-reference-code"
              type="text"
              ref={referenceCodeRef}
              defaultValue="academic-demo"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            <div className="forgot-password">
              <button
                type="button"
                className="forgot-password-link"
                aria-label="Forgot password"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
              aria-label="Submit login form"
            >
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
