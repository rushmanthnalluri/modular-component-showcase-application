import Layout from "@/components/Layout";
import { privacyContent } from "@/data/legal.content";

const Privacy = () => {
  return (
    <Layout>
      <section className="contact-page">
        <div className="layout-container">
          <div className="contact-card">
            <h1>{privacyContent.title}</h1>
            <p>{privacyContent.intro}</p>
            {privacyContent.sections.map((section) => (
              <p key={section.label}>
                <strong>{section.label}:</strong> {section.text}
              </p>
            ))}
            <p>
              <strong>Last updated:</strong> {privacyContent.lastUpdated}.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
