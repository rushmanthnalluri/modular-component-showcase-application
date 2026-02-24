import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CodeBlock,
  Layout,
  previewComponents,
} from "@/showcase";
import { components } from "@/showcase/components.data";
import "./ComponentDetails.css";

const ComponentDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("jsx");
  const item = components.find((component) => component.id === id || component.preview === id);

  const PreviewComponent = item?.preview
    ? previewComponents[item.preview]
    : null;

  if (!item) {
    return (
      <Layout>
        <div className="layout-container details-state">
          <h2>Component not found</h2>
          <p>The component you are looking for does not exist.</p>
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
        <Link to="/" className="back-btn">
          Back to Components
        </Link>

        <div className="details-head">
          <h1>{item.name}</h1>
          <span className="component-tag">{item.category}</span>
        </div>
        <p className="details-desc">{item.description}</p>

        <div className="details-grid">
          <div className="preview-box">
            <div className="preview-head">
              <span>Live Preview</span>
            </div>
            <div className="preview-body">
              {PreviewComponent ? (
                <PreviewComponent />
              ) : (
                <p>Preview not available for this component.</p>
              )}
            </div>
          </div>

          <div className="code-pane">
            <div className="code-tabs">
              <button
                type="button"
                className={activeTab === "jsx" ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab("jsx")}
              >
                JSX
              </button>
              {item.code.css ? (
                <button
                  type="button"
                  className={activeTab === "css" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveTab("css")}
                >
                  CSS
                </button>
              ) : null}
            </div>

            {activeTab === "jsx" ? (
              <CodeBlock code={item.code.jsx} language="jsx" />
            ) : (
              <CodeBlock code={item.code.css || ""} language="css" />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComponentDetail;
