import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/features/showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const initialFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialFieldErrors = {
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const Register = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

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
    return Object.values(nextErrors).every((hasError) => !hasError);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateRequiredFields()) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordMismatch(true);
      toast({
        title: "Password mismatch",
        description: "Password and confirm password should be the same.",
      });
      return;
    }

    toast({
      title: "Validation successful",
      description: "Registration data is ready for processing.",
    });
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
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
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  aria-invalid={fieldErrors.fullName}
                  className={
                    fieldErrors.fullName
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {fieldErrors.fullName ? (
                  <p className="text-xs font-medium text-red-600">
                    Full name is required.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  aria-invalid={fieldErrors.email}
                  className={
                    fieldErrors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {fieldErrors.email ? (
                  <p className="text-xs font-medium text-red-600">
                    Email is required.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  aria-invalid={fieldErrors.password}
                  className={
                    fieldErrors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {fieldErrors.password ? (
                  <p className="text-xs font-medium text-red-600">
                    Password is required.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  aria-invalid={fieldErrors.confirmPassword || passwordMismatch}
                  className={
                    fieldErrors.confirmPassword || passwordMismatch
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {fieldErrors.confirmPassword ? (
                  <p className="text-xs font-medium text-red-600">
                    Confirm password is required.
                  </p>
                ) : null}
                {passwordMismatch ? (
                  <p className="text-xs font-medium text-red-600">
                    Password and confirm password should be the same.
                  </p>
                ) : null}
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
