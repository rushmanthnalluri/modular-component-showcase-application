import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { copyToClipboard, downloadFile } from "@/services/exportService";
import { useToast } from "@/use-toast";
import "./Templates.css";

const templates = [
  {
    id: "button",
    name: "Button Component",
    jsx: `export default function Button({ label = "Click", onClick }) {\n  return <button className="btn" onClick={onClick}>{label}</button>;\n}`,
    css: `.btn {\n  border: 0;\n  border-radius: 8px;\n  padding: 10px 14px;\n  background: #f97316;\n  color: #fff;\n}`,
  },
  {
    id: "card",
    name: "Card Component",
    jsx: `export default function Card({ title, children }) {\n  return (\n    <section className="card">\n      <h3>{title}</h3>\n      <div>{children}</div>\n    </section>\n  );\n}`,
    css: `.card {\n  border: 1px solid #e5e7eb;\n  border-radius: 12px;\n  padding: 16px;\n  background: #fff;\n}`,
  },
  {
    id: "modal",
    name: "Modal Component",
    jsx: `export default function Modal({ open, title, children, onClose }) {\n  if (!open) return null;\n  return (\n    <div className="overlay" onClick={onClose}>\n      <div className="modal" onClick={(e) => e.stopPropagation()}>\n        <h3>{title}</h3>\n        {children}\n      </div>\n    </div>\n  );\n}`,
    css: `.overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.35);\n  display: grid;\n  place-items: center;\n}\n.modal {\n  width: min(560px, 92vw);\n  background: #fff;\n  border-radius: 12px;\n  padding: 16px;\n}`,
  },
];

export default function Templates() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState("button");
  const active = useMemo(() => templates.find((template) => template.id === activeId) || templates[0], [activeId]);

  function copyAll() {
    const source = `/* ${active.name} */\n\n${active.jsx}\n\n${active.css}`;
    copyToClipboard(source, `${active.name} template`);
    toast({ title: "Copied", description: `${active.name} template copied.` });
  }

  function downloadAll() {
    const source = `/* ${active.name} */\n\n${active.jsx}\n\n${active.css}`;
    downloadFile(source, `${active.id}-template.txt`);
    toast({ title: "Downloaded", description: `${active.name} template exported.` });
  }

  return (
    <Layout>
      <div className="layout-container templates-page">
        <header>
          <h1>Component Templates Generator</h1>
          <p>Start from boilerplates and customize quickly.</p>
        </header>

        <div className="templates-grid">
          <aside>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={activeId === template.id ? "active" : ""}
                onClick={() => setActiveId(template.id)}
              >
                {template.name}
              </button>
            ))}
          </aside>

          <section>
            <div className="template-actions">
              <button type="button" onClick={copyAll}>Copy Template</button>
              <button type="button" onClick={downloadAll}>Download Template</button>
            </div>
            <h2>{active.name}</h2>
            <h3>JSX</h3>
            <pre>{active.jsx}</pre>
            <h3>CSS</h3>
            <pre>{active.css}</pre>
          </section>
        </div>
      </div>
    </Layout>
  );
}
