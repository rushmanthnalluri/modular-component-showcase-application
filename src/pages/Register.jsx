import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/features/showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import userIcon from "@/assets/showcase/user.png";
import alternateUserIcon from "@/assets/showcase/user (2).png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import phoneIcon from "@/assets/showcase/phone.png";
import warningIcon from "@/assets/showcase/warning.png";
import errorIcon from "@/assets/showcase/error.png";
import successIcon from "@/assets/showcase/success.png";

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
  const [showPasswords, setShowPasswords] = useState(false);

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
    missingFields.slice(0, 2).forEach((fieldName) => {
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
    });
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30 p-2">
              <img
                src={alternateUserIcon}
                alt="Registration user"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="display-font text-3xl font-bold text-foreground mb-2">
              Register
            </h1>
            <p className="text-muted-foreground mb-8">
              Create a new account to access the application.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <img
                    src={userIcon}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    aria-invalid={fieldErrors.fullName}
                    className={`pl-10 ${
                      fieldErrors.fullName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <img
                    src={mailIcon}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    aria-invalid={fieldErrors.email}
                    className={`pl-10 ${
                      fieldErrors.email
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <div className="relative">
                  <img
                    src={phoneIcon}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 555 000 0000"
                    aria-invalid={fieldErrors.phone}
                    className={`pl-10 ${
                      fieldErrors.phone
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <img
                    src={lockIcon}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    type={showPasswords ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    aria-invalid={fieldErrors.password}
                    className={`pl-10 pr-10 ${
                      fieldErrors.password
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                  >
                    <img
                      src={eyeIcon}
                      alt=""
                      aria-hidden
                      className={`h-4 w-4 ${showPasswords ? "opacity-100" : "opacity-60"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <img
                    src={lockIcon}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    type={showPasswords ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    aria-invalid={fieldErrors.confirmPassword || passwordMismatch}
                    className={`pl-10 pr-10 ${
                      fieldErrors.confirmPassword || passwordMismatch
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                  >
                    <img
                      src={eyeIcon}
                      alt=""
                      aria-hidden
                      className={`h-4 w-4 ${showPasswords ? "opacity-100" : "opacity-60"}`}
                    />
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full">
                Register
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Register;
