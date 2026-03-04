import Layout from "@/components/Layout";
import { APP_INFO } from "@/data/app.constants";
import { Linkedin, Mail, Phone } from "lucide-react";
import "./Contact.css";

const Contact = () => {
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
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
