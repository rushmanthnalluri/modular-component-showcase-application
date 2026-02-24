import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CodeBlock,
  Layout,
  previewComponents,
  useComponent,
} from "@/features/showcase";
import "./ComponentDetails.css";

const ComponentDetail = () => {
  const { id } = useParams();
  const [isDarkPreview, setIsDarkPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("jsx");
  const { data: component, isLoading, error } = useComponent(id);

  const PreviewComponent = component?.preview
    ? previewComponents[component.preview]
    : null;

  if (isLoading) {
    return (
      <Layout>
        <div className="layout-container details-state">
          <div className="loader" />
        </div>
      </Layout>
    );
  }

  if (error || !component) {
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
          <h1>{component.name}</h1>
          <span className="component-tag">{component.category}</span>
        </div>
        <p className="details-desc">{component.description}</p>

        <div className="details-grid">
          <div className="preview-box">
            <div className="preview-head">
              <span>Live Preview</span>
              <button
                type="button"
                onClick={() => setIsDarkPreview((prev) => !prev)}
              >
                {isDarkPreview ? "Light" : "Dark"}
              </button>
            </div>
            <div
              className={
                isDarkPreview ? "preview-body dark-preview" : "preview-body"
              }
            >
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
              {component.code.css ? (
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
              <CodeBlock code={component.code.jsx} language="jsx" />
            ) : (
              <CodeBlock code={component.code.css || ""} language="css" />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComponentDetail;
