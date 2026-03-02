import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeBlock from "@/components/CodeBlock";
import Layout from "@/components/Layout";
import { components } from "@/data/components.data";
import "./ComponentDetails.css";

const ComponentDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("jsx");
  const item = components.find((component) => component.id === id);
  const [previewSrc, setPreviewSrc] = useState("");

  useEffect(() => {
    setPreviewSrc(item?.screenshot || item?.thumbnail || "");
  }, [item]);

  const handlePreviewError = () => {
    if (item?.thumbnail && previewSrc !== item.thumbnail) {
      setPreviewSrc(item.thumbnail);
      return;
    }
    setPreviewSrc("");
  };

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
        <p className="details-desc">
          <Link to={`/component/${item.id}/code`} className="back-btn">
            Open Dedicated Code Route
          </Link>
        </p>

        <div className="details-grid">
          <div className="preview-box">
            <div className="preview-head">
              <span>Live Preview</span>
            </div>
            <div className="preview-body">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={`${item.name} screenshot`}
                  className="preview-screenshot"
                  onError={handlePreviewError}
                />
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
                aria-label="Show JSX code tab"
              >
                JSX
              </button>
              {item.code.css ? (
                <button
                  type="button"
                  className={activeTab === "css" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveTab("css")}
                  aria-label="Show CSS code tab"
                >
                  CSS
                </button>
              ) : null}
            </div>

            {activeTab === "jsx" ? (
              <>
                {/* Declarative tab rendering: active state decides which code block is shown. */}
                <CodeBlock code={item.code.jsx} language="jsx" />
              </>
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
