import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/use-toast";
import Header from "@/components/layout/Header";
import { fetchRegisterCaptcha, registerUser } from "@/services/authAccess";
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
const MAX_AVATAR_FILE_BYTES = 1_500_000;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

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
    bio: "",
    avatarImage: "",
    socialLinks: {
      github: "",
      twitter: "",
      portfolio: "",
    },
    emailPreferences: {
      newComponents: true,
      reviewComments: true,
      newsletters: false,
    },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState({ text: "", image: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");

  const getCaptchaImageSrc = (rawImage) => {
    const value = String(rawImage || "").trim();
    if (!value) {
      return "";
    }

    return value.startsWith("data:image")
      ? value
      : `data:image/svg+xml;base64,${value}`;
  };

  const showCaptchaUnavailableToast = useCallback(() => {
    toast({
      title: "Captcha unavailable",
      description: "Captcha service unavailable. Please refresh.",
      duration: 4000,
    });
  }, [toast]);

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(String(file.type || "").toLowerCase())) {
      toast({
        title: "Unsupported avatar format",
        description: "Please upload PNG, JPG, WEBP, or GIF image files.",
        duration: 4000,
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      toast({
        title: "Avatar image too large",
        description: "Please upload an image smaller than 1.5 MB.",
        duration: 4000,
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setData((prev) => ({ ...prev, avatarImage: dataUrl }));
      setAvatarFileName(file.name);
    };
    reader.onerror = () => {
      toast({
        title: "Avatar upload failed",
        description: "Could not read the selected image. Please try another file.",
        duration: 4000,
      });
    };
    reader.readAsDataURL(file);
  };

  const loadCaptcha = useCallback(async () => {
    const payload = await fetchRegisterCaptcha(6);
    setCaptcha({ text: payload.text, image: payload.image });
    setCaptchaInput("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      loadCaptcha().catch(() => {
        if (!cancelled) {
          showCaptchaUnavailableToast();
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [loadCaptcha, showCaptchaUnavailableToast]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name.startsWith("socialLinks.")) {
      const socialKey = name.split(".")[1];
      setData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value,
        },
      }));
      return;
    }

    if (name.startsWith("emailPreferences.")) {
      const preferenceKey = name.split(".")[1];
      setData((prev) => ({
        ...prev,
        emailPreferences: {
          ...prev.emailPreferences,
          [preferenceKey]: type === "checkbox" ? checked : Boolean(value),
        },
      }));
      return;
    }

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
      await loadCaptcha().catch(() => {
        showCaptchaUnavailableToast();
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        bio: data.bio,
        avatarImage: data.avatarImage,
        socialLinks: data.socialLinks,
        emailPreferences: data.emailPreferences,
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
      await loadCaptcha().catch(() => {
        showCaptchaUnavailableToast();
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
                autoComplete="name"
                aria-invalid={errors.fullName ? "true" : "false"}
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
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
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
                autoComplete="tel"
                aria-invalid={errors.phone ? "true" : "false"}
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
                aria-invalid={errors.role ? "true" : "false"}
              >
                <option value="user">User</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="register-bio" className="sr-only">
                Bio
              </label>
              <input
                id="register-bio"
                type="text"
                name="bio"
                value={data.bio}
                onChange={handleChange}
                placeholder="Short bio (optional)"
                maxLength={500}
              />
            </div>

            <div className="input-group input-group-plain avatar-upload-group">
              <label htmlFor="register-avatar-file" className="file-upload-label">
                Upload avatar image (optional)
              </label>
              <input
                id="register-avatar-file"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleAvatarFileChange}
              />
              {avatarFileName ? <small className="avatar-file-note">Selected: {avatarFileName}</small> : null}
              {data.avatarImage && data.avatarImage.startsWith("data:image") ? (
                <img className="avatar-preview" src={data.avatarImage} alt="Avatar preview" />
              ) : null}
            </div>

            <div className="input-group">
              <label htmlFor="register-github" className="sr-only">
                GitHub URL
              </label>
              <input
                id="register-github"
                type="url"
                name="socialLinks.github"
                value={data.socialLinks.github}
                onChange={handleChange}
                placeholder="GitHub URL (optional)"
                autoComplete="url"
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-twitter" className="sr-only">
                Twitter URL
              </label>
              <input
                id="register-twitter"
                type="url"
                name="socialLinks.twitter"
                value={data.socialLinks.twitter}
                onChange={handleChange}
                placeholder="Twitter URL (optional)"
                autoComplete="url"
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-portfolio" className="sr-only">
                Portfolio URL
              </label>
              <input
                id="register-portfolio"
                type="url"
                name="socialLinks.portfolio"
                value={data.socialLinks.portfolio}
                onChange={handleChange}
                placeholder="Portfolio URL (optional)"
                autoComplete="url"
              />
            </div>

            <div className="input-group checkbox-group">
              <label htmlFor="register-pref-new-components">
                <input
                  id="register-pref-new-components"
                  type="checkbox"
                  name="emailPreferences.newComponents"
                  checked={data.emailPreferences.newComponents}
                  onChange={handleChange}
                />{" "}
                Email me about new components
              </label>
            </div>

            <div className="input-group checkbox-group">
              <label htmlFor="register-pref-review-comments">
                <input
                  id="register-pref-review-comments"
                  type="checkbox"
                  name="emailPreferences.reviewComments"
                  checked={data.emailPreferences.reviewComments}
                  onChange={handleChange}
                />{" "}
                Email me about review comments
              </label>
            </div>

            <div className="input-group checkbox-group">
              <label htmlFor="register-pref-newsletters">
                <input
                  id="register-pref-newsletters"
                  type="checkbox"
                  name="emailPreferences.newsletters"
                  checked={data.emailPreferences.newsletters}
                  onChange={handleChange}
                />{" "}
                Subscribe to newsletter
              </label>
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
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : "false"}
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
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword || passwordMismatch ? "true" : "false"}
              />
            </div>

            <div className="captcha-group">
              {captcha.image ? (
                <img
                  className="captcha-image"
                  src={getCaptchaImageSrc(captcha.image)}
                  alt="Captcha"
                />
              ) : (
                <div className="captcha-placeholder">Loading captcha...</div>
              )}
              <button
                type="button"
                className="captcha-refresh"
                onClick={() => {
                  loadCaptcha().catch(() => {
                    showCaptchaUnavailableToast();
                  });
                }}
              >
                Refresh Captcha
              </button>
            </div>

            <div className="input-group">
              <label htmlFor="register-captcha" className="sr-only">
                Captcha
              </label>
              <input
                id="register-captcha"
                type="text"
                name="captcha"
                value={captchaInput}
                onChange={(event) => setCaptchaInput(event.target.value)}
                placeholder="Enter captcha"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              aria-label="Submit registration form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
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
