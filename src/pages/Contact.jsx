import { useState } from "react";
import Layout from "@/components/Layout";
import { APP_INFO } from "@/data/app.constants";
import { Linkedin, Mail, Phone } from "lucide-react";
import { useToast } from "@/use-toast";
import { sendSupportTicketEmail } from "@/services/emailService";
import "./Contact.css";

const Contact = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email to receive the ticket reply.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await sendSupportTicketEmail(normalizedEmail);
      toast({
        title: "Ticket created",
        description: `Ticket mail sent to ${normalizedEmail}.`,
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Ticket failed",
        description: error.message || "Unable to create support ticket.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="contact-page">
        <div className="layout-container">
          <div className="contact-card">
            <h1>Contact Us</h1>
            <p>
              Reach out for project queries, feedback, or collaboration
              opportunities.
            </p>

            <div className="contact-items">
              <div className="contact-item">
                <span className="contact-label">
                  <Mail size={16} />
                  <span>Email</span>
                </span>
                <a href={`mailto:${APP_INFO.supportEmail}`} className="contact-link">
                  {APP_INFO.supportEmail}
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Phone size={16} />
                  <span>Phone</span>
                </span>
                <a href={`tel:${APP_INFO.supportPhoneRaw}`} className="contact-link">
                  {APP_INFO.supportPhoneDisplay}
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </span>
                <a
                  href={APP_INFO.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  {APP_INFO.linkedInHandle}
                </a>
              </div>
            </div>

            <form className="support-ticket-form" onSubmit={handleSubmit} noValidate>
              <h2>Raise Support Ticket</h2>
              <p>Enter your email and we will send the ticket reply to your inbox.</p>
              <label htmlFor="ticket-email" className="support-label">
                Your Email
              </label>
              <input
                id="ticket-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="support-input"
                autoComplete="email"
              />
              <button type="submit" className="support-submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Create Ticket"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
