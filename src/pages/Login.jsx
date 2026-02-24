import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/features/showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
      description: "Credentials are ready for authentication.",
    });
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
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
                  placeholder="Enter password"
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
