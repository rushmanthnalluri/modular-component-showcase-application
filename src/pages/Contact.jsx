import { Layout } from "@/features/showcase";
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
                <span>Email</span>
                <span>rushmanth21@gmail.com</span>
              </div>
              <div className="contact-item">
                <span>Phone</span>
                <span>9912387093</span>
              </div>
              <div className="contact-item">
                <span>LinkedIn</span>
                <span>rushmanthnalluri</span>
              </div>
            </div>

            <div className="contact-actions">
              <a
                href="https://www.linkedin.com/in/rushmanthnalluri/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark"
              >
                Open LinkedIn Profile
              </a>
              <a href="mailto:rushmanth21@gmail.com" className="btn-outline">
                Send Email
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
