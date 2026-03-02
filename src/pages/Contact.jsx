import Layout from "@/components/Layout";
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
                <span>rushmanth21@gmail.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Phone size={16} />
                  <span>Phone</span>
                </span>
                <span>9912387093</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </span>
                <a
                  href="https://www.linkedin.com/in/rushmanthnalluri/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  rushmanthnalluri
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
