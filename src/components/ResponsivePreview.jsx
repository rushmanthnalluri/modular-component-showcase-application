import { useState } from "react";
import "./ResponsivePreview.css";

const SIZES = [
  { key: "mobile", label: "Mobile", width: 375 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Desktop", width: 1200 },
];

export default function ResponsivePreview({ children }) {
  const [size, setSize] = useState("desktop");
  const selected = SIZES.find((entry) => entry.key === size) || SIZES[2];

  return (
    <section className="responsive-preview" aria-label="Responsive component simulator">
      <div className="responsive-controls">
        <h3>Responsive Simulator</h3>
        <div role="tablist" aria-label="Preview size controls">
          {SIZES.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={size === entry.key}
              className={size === entry.key ? "active" : ""}
              onClick={() => setSize(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
      <div className="responsive-frame-wrap">
        <div className="responsive-frame" style={{ width: `${selected.width}px` }}>
          {children}
        </div>
      </div>
    </section>
  );
}
