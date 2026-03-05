import Layout from "@/components/Layout";
import { termsContent } from "@/data/legal.content";

const Terms = () => {
  return (
    <Layout>
      <section className="contact-page">
        <div className="layout-container">
          <div className="contact-card">
            <h1>{termsContent.title}</h1>
            <p>{termsContent.intro}</p>
            {termsContent.sections.map((section) => (
              <p key={section.label}>
                <strong>{section.label}:</strong> {section.text}
              </p>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
