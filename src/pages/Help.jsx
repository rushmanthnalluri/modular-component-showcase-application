import Layout from "@/components/Layout";
import { helpContent } from "@/data/legal.content";

const Help = () => {
  return (
    <Layout>
      <section className="contact-page">
        <div className="layout-container">
          <div className="contact-card">
            <h1>{helpContent.title}</h1>
            <p>{helpContent.intro}</p>
            {helpContent.sections.map((section) => (
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

export default Help;
