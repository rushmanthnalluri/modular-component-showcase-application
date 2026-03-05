import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/components/Header";
import { authenticateUser, fetchRegisterCaptcha, forgotPassword } from "@/services/authAccess";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import warningIcon from "@/assets/showcase/warning.png";
import successIcon from "@/assets/showcase/success.png";
import "./Auth.css";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Controlled inputs: React state is the single source of truth.
  const [data, setData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState({ text: "", image: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [forgotData, setForgotData] = useState({ email: "", phone: "", newPassword: "" });
  const forgotEmailRef = useRef(null);
  const forgotPasswordButtonRef = useRef(null);

  const loadCaptcha = async () => {
    const payload = await fetchRegisterCaptcha(6);
    setCaptcha({
      text: String(payload?.text || ""),
      image: String(payload?.image || ""),
    });
    setCaptchaInput("");
  };

  useEffect(() => {
    loadCaptcha().catch(() => {
      toast({
        title: "Captcha unavailable",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            Unable to load captcha. Please refresh and try again.
          </span>
        ),
        duration: 4000,
      });
    });
  }, [toast]);

  useEffect(() => {
    if (!showForgotPasswordForm) {
      return;
    }

    forgotEmailRef.current?.focus();
  }, [showForgotPasswordForm]);

  useEffect(() => {
    if (!showForgotPasswordForm) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isResetSubmitting) {
        event.preventDefault();
        closeForgotPasswordPanel(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showForgotPasswordForm, isResetSubmitting]);

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

  const handleForgotPasswordClick = () => {
    setForgotData((prev) => ({
      ...prev,
      email: data.email.trim() || prev.email,
    }));
    setShowForgotPasswordForm(true);
  };

  const handleForgotPasswordChange = (event) => {
    const { name, value } = event.target;
    setForgotData((prev) => ({
      ...prev,
      [name]: name === "phone" ? value.replace(/\D/g, "") : value,
    }));
  };

  const closeForgotPasswordPanel = (shouldFocusTrigger = false) => {
    setShowForgotPasswordForm(false);
    setForgotData({ email: "", phone: "", newPassword: "" });

    if (shouldFocusTrigger) {
      window.setTimeout(() => {
        forgotPasswordButtonRef.current?.focus();
      }, 0);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    const email = forgotData.email.trim();
    const phone = forgotData.phone.trim();
    const newPassword = forgotData.newPassword;

    if (!email || !phone || !newPassword) {
      toast({
        title: "All fields are required",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            Enter email, phone number, and new password.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast({
        title: "Invalid email",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            Please enter a valid email address.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            New password must be at least 6 characters.
          </span>
        ),
        duration: 4000,
      });
      return;
    }

    try {
      setIsResetSubmitting(true);
      await forgotPassword({ email, phone, newPassword });
      toast({
        title: "Password reset successful",
        description: (
          <span className="toast-inline">
            <img src={successIcon} alt="" aria-hidden className="toast-inline-icon" />
            Use your new password to login.
          </span>
        ),
        duration: 4000,
      });
      closeForgotPasswordPanel(true);
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            {error.message}
          </span>
        ),
        duration: 4000,
      });
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingFields = validateForm();
    if (missingFields.length > 0) {
      showMissingFieldToasts(missingFields);
      return;
    }

    const captchaMatches =
      captchaInput.trim().toLowerCase() !== "" &&
      captcha.text.trim().toLowerCase() !== "" &&
      captchaInput.trim().toLowerCase() === captcha.text.trim().toLowerCase();

    if (!captchaMatches) {
      toast({
        title: "Invalid captcha",
        description: (
          <span className="toast-inline">
            <img src={warningIcon} alt="" aria-hidden className="toast-inline-icon" />
            Please enter the captcha exactly as shown.
          </span>
        ),
        duration: 4000,
      });
      await loadCaptcha().catch(() => {});
      return;
    }

    try {
      setIsSubmitting(true);
      const authUser = await authenticateUser({
        email: data.email.trim(),
        password: data.password,
      });

      toast({
        title: "Login successful",
        description: (
          <span className="toast-inline">
            <img src={successIcon} alt="" aria-hidden className="toast-inline-icon" />
            Welcome back, {authUser.fullName || authUser.email}.
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
      await loadCaptcha().catch(() => {});
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

            <div className="captcha-group">
              {captcha.image ? (
                <img
                  className="captcha-image"
                  src={`data:image/png;base64,${captcha.image}`}
                  alt="Captcha"
                />
              ) : (
                <div className="captcha-placeholder">Loading captcha...</div>
              )}
              <button
                type="button"
                className="captcha-refresh"
                onClick={() => {
                  loadCaptcha().catch(() => {});
                }}
              >
                Refresh Captcha
              </button>
            </div>

            <div className="input-group">
              <label htmlFor="login-captcha" className="sr-only">
                Captcha
              </label>
              <input
                id="login-captcha"
                type="text"
                name="captcha"
                value={captchaInput}
                onChange={(event) => setCaptchaInput(event.target.value)}
                placeholder="Enter captcha"
              />
            </div>

            <div className="forgot-password">
              <button
                type="button"
                className="forgot-password-link"
                aria-label="Forgot password"
                ref={forgotPasswordButtonRef}
                onClick={handleForgotPasswordClick}
              >
                Forgot Password?
              </button>
            </div>

            {showForgotPasswordForm ? (
              <div className="forgot-password-panel" aria-label="Forgot password reset form">
                <div className="input-group">
                  <label htmlFor="forgot-email" className="sr-only">
                    Registered email
                  </label>
                  <img className="left-icon" src={mailIcon} alt="" aria-hidden />
                  <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    ref={forgotEmailRef}
                    value={forgotData.email}
                    onChange={handleForgotPasswordChange}
                    placeholder="Registered email"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="forgot-phone" className="sr-only">
                    Registered phone number
                  </label>
                  <img className="left-icon" src={mailIcon} alt="" aria-hidden />
                  <input
                    id="forgot-phone"
                    type="text"
                    name="phone"
                    inputMode="numeric"
                    value={forgotData.phone}
                    onChange={handleForgotPasswordChange}
                    placeholder="Registered phone number"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="forgot-new-password" className="sr-only">
                    New password
                  </label>
                  <img className="left-icon" src={lockIcon} alt="" aria-hidden />
                  <input
                    id="forgot-new-password"
                    type="password"
                    name="newPassword"
                    value={forgotData.newPassword}
                    onChange={handleForgotPasswordChange}
                    placeholder="New password"
                  />
                </div>

                <div className="forgot-password-actions">
                  <button
                    type="button"
                    className="auth-submit"
                    onClick={handleForgotPasswordSubmit}
                    disabled={isResetSubmitting}
                  >
                    {isResetSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                  <button
                    type="button"
                    className="auth-cancel"
                    onClick={() => {
                      closeForgotPasswordPanel(true);
                    }}
                    disabled={isResetSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

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
