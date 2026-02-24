import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/features/showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import userIcon from "@/assets/showcase/user.png";
import mailIcon from "@/assets/showcase/mail.png";
import lockIcon from "@/assets/showcase/lock.png";
import eyeIcon from "@/assets/showcase/eye.png";
import warningIcon from "@/assets/showcase/warning.png";
import successIcon from "@/assets/showcase/success.png";

const initialFormData = {
  email: "",
  password: "",
};

const initialFieldErrors = {
  email: false,
  password: false,
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
    return Object.values(nextErrors).every((hasError) => !hasError);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateRequiredFields()) {
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
    });
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30 p-2">
              <img
                src={userIcon}
                alt="User"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="display-font text-3xl font-bold text-foreground mb-2">
              Login
            </h1>
            <p className="text-muted-foreground mb-8">
              Sign in to continue to the application.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                {fieldErrors.email ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <img
                      src={warningIcon}
                      alt=""
                      aria-hidden
                      className="h-3.5 w-3.5"
                    />
                    Email is required.
                  </p>
                ) : null}
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    aria-invalid={fieldErrors.password}
                    className={`pl-10 pr-10 ${
                      fieldErrors.password
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={eyeIcon}
                      alt=""
                      aria-hidden
                      className={`h-4 w-4 ${showPassword ? "opacity-100" : "opacity-60"}`}
                    />
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <img
                      src={warningIcon}
                      alt=""
                      aria-hidden
                      className="h-3.5 w-3.5"
                    />
                    Password is required.
                  </p>
                ) : null}
              </div>

              <Button type="submit" variant="hero" className="w-full">
                Login
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-primary font-semibold">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
