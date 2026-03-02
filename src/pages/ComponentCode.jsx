import { Link, useParams } from "react-router-dom";
import CodeBlock from "@/components/CodeBlock";
import Layout from "@/components/Layout";
import { components } from "@/data/components.data";
import "./ComponentDetails.css";

const ComponentCode = () => {
  const { id } = useParams();
  const item = components.find((componentItem) => componentItem.id === id);

  if (!item) {
    return (
      <Layout>
        <div className="layout-container details-state">
          <h2>Component not found</h2>
          <p>The component code you are looking for does not exist.</p>
          <Link className="back-btn" to="/">
            Go back home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="layout-container details-page">
        <Link to={`/component/${item.id}`} className="back-btn">
          Back to Component Preview
        </Link>

        <div className="details-head">
          <h1>{item.name} Code</h1>
          <span className="component-tag">{item.category}</span>
        </div>
        <p className="details-desc">JSX and CSS source for this component.</p>

        <div className="details-grid">
          <div className="code-pane">
            <CodeBlock code={item.code.jsx} language="jsx" />
          </div>
          <div className="code-pane">
            <CodeBlock code={item.code.css || "/* CSS not available */"} language="css" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComponentCode;