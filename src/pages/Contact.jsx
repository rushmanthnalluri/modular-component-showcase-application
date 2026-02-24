import { Mail, Phone, User } from "lucide-react";
import { Layout } from "@/features/showcase";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-sm">
            <h1 className="display-font text-4xl font-bold text-foreground mb-3">
              Contact Us
            </h1>
            <p className="text-muted-foreground mb-8">
              Reach out for project queries, feedback, or collaboration.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-main px-4 py-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-foreground">rushmanth21@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-main px-4 py-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-foreground">9912387093</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-main px-4 py-3">
                <User className="w-5 h-5 text-primary" />
                <span className="text-foreground">rushmanthnalluri</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero">
                <a
                  href="https://www.linkedin.com/in/rushmanthnalluri/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open LinkedIn Profile
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:rushmanth21@gmail.com">Send Email</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
