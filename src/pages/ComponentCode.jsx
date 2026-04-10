import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeBlock from "@/components/CodeBlock";
import Layout from "@/components/Layout";
import { components } from "@/data/components.data";
import { copyToClipboard, exportComponentCode, downloadFile, generateImportStatement } from "@/services/exportService";
import { useToast } from "@/use-toast";

import "./ComponentDetails.css";
import "./ComponentCode.css";

const ComponentCode = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState("jsx");
  const [showImportOptions, setShowImportOptions] = useState(false);

  const item = useMemo(() => {
    return components.find((c) => c.id === id) || null;
  }, [id]);

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

  const handleCopyCode = (code, label) => {
    copyToClipboard(code, label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      duration: 2500,
    });
  };

  const handleExport = () => {
    const { content, filename } = exportComponentCode(item, selectedFormat);
    downloadFile(content, filename);
    toast({
      title: "Exported!",
      description: `Component exported as ${filename}`,
      duration: 2500,
    });
  };

  const handleCopyImport = (framework) => {
    const importStatement = generateImportStatement(item, framework);
    copyToClipboard(importStatement, `${framework.toUpperCase()} import statement`);
    toast({
      title: "Copied!",
      description: `${framework} import statement copied`,
      duration: 2500,
    });
    setShowImportOptions(false);
  };

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

        {/* Export & Copy Options */}
        <div className="code-options-bar">
          <div className="export-group">
            <label htmlFor="format-select">Export as:</label>
            <select 
              id="format-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="jsx">JSX File</option>
              <option value="css">CSS File</option>
              <option value="bundle">Bundle (JSX + CSS)</option>
              <option value="with-imports">With Imports</option>
            </select>
            <button className="btn-export" onClick={handleExport}>
              ⬇ Export {selectedFormat.toUpperCase()}
            </button>
          </div>

          <div className="import-group">
            <button 
              className="btn-import"
              onClick={() => setShowImportOptions(!showImportOptions)}
            >
              📋 Import Statement
            </button>
            {showImportOptions && (
              <div className="import-menu">
                <button onClick={() => handleCopyImport("react")}>React</button>
                <button onClick={() => handleCopyImport("vue")}>Vue</button>
                <button onClick={() => handleCopyImport("svelte")}>Svelte</button>
                <button onClick={() => handleCopyImport("angular")}>Angular</button>
              </div>
            )}
          </div>
        </div>

        <div className="details-grid">
          <div className="code-pane">
            <div className="pane-header">
              <h3>JSX Code</h3>
              <button 
                className="btn-quick-copy"
                onClick={() => handleCopyCode(item.code.jsx, "JSX Code")}
                title="Copy JSX code"
              >
                📋 Copy
              </button>
            </div>
            <CodeBlock code={item.code.jsx} language="jsx" />
          </div>
          <div className="code-pane">
            <div className="pane-header">
              <h3>CSS Code</h3>
              <button 
                className="btn-quick-copy"
                onClick={() => handleCopyCode(item.code.css || "/* CSS not available */", "CSS Code")}
                title="Copy CSS code"
              >
                📋 Copy
              </button>
            </div>
            <CodeBlock code={item.code.css || "/* CSS not available */"} language="css" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComponentCode;