import { useState } from "react";
import Layout from "@/components/Layout";
import { APP_INFO } from "@/data/app.constants";
import { Linkedin, Mail, Phone } from "lucide-react";
import { useToast } from "@/use-toast";
import { sendSupportTicketEmail } from "@/services/emailService";
import "./Contact.css";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    name: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Bug Report",
    "Feature Request",
    "Account Access",
    "Billing",
    "General Support",
  ];

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      name: form.name.trim(),
      website: form.website.trim(),
    };

    if (!payload.title || !payload.category || !payload.description || !payload.name) {
      toast({
        title: "All fields required",
        description: "Please fill title, category, description, and your name.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await sendSupportTicketEmail(payload);
      toast({
        title: "Ticket created",
        description: `Thank you, ${payload.name}! Your support ticket has been submitted.`,
      });
      setForm({
        title: "",
        category: "",
        description: "",
        name: "",
        website: "",
      });
    } catch (error) {
      const errorMessage = String(error?.message || "");
      const isNotFound = errorMessage.includes("404");

      if (isNotFound) {
        const subject = encodeURIComponent(`Support Ticket: ${payload.title}`);
        const body = encodeURIComponent(
          [
            `Category: ${payload.category}`,
            `From: ${payload.name}`,
            "",
            payload.description,
          ].join("\n")
        );

        window.location.href = `mailto:${APP_INFO.supportEmail}?subject=${subject}&body=${body}`;
        toast({
          title: "Backend ticket API unavailable",
          description: "Opened your email app with ticket details prefilled.",
        });
        return;
      }

      toast({
        title: "Ticket failed",
        description: errorMessage || "Unable to create support ticket.",
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
                  <Mail size={16} aria-hidden="true" />
                  <span>Email</span>
                </span>
                <a href={`mailto:${APP_INFO.supportEmail}`} className="contact-link">
                  {APP_INFO.supportEmail}
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Phone size={16} aria-hidden="true" />
                  <span>Phone</span>
                </span>
                <a href={`tel:${APP_INFO.supportPhoneRaw}`} className="contact-link">
                  {APP_INFO.supportPhoneDisplay}
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Linkedin size={16} aria-hidden="true" />
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
              <p>Submit ticket details and we will send updates to your email.</p>
              <label htmlFor="ticket-title" className="support-label">
                Ticket Title
              </label>
              <input
                id="ticket-title"
                type="text"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Short title of your issue"
                className="support-input"
                maxLength={120}
                required
              />

              <label htmlFor="ticket-category" className="support-label">
                Category
              </label>
              <select
                id="ticket-category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="support-input"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <label htmlFor="ticket-description" className="support-label">
                Description
              </label>
              <textarea
                id="ticket-description"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Describe your issue in detail"
                className="support-input support-textarea"
                rows={5}
                maxLength={1500}
                required
              />

              <label htmlFor="ticket-name" className="support-label">
                Your Name
              </label>
              <input
                id="ticket-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Enter your full name"
                className="support-input"
                autoComplete="name"
                maxLength={120}
                required
              />
              <label
                htmlFor="ticket-website"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
              >
                Website
              </label>
              <input
                id="ticket-website"
                type="text"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
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
