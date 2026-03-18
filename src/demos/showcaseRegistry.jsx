import { useEffect, useMemo, useState } from "react";

const CHART_MIN = 0;
const CHART_MAX = 100;
const NAV_LINKS = ["Home", "Components", "Patterns", "Support"];

const TABLE_ROWS = [
  { id: "c-101", name: "Button Variants", owner: "Priya", status: "Stable", adoption: 92 },
  { id: "c-102", name: "Card Layout System", owner: "Rahul", status: "Review", adoption: 84 },
  { id: "c-103", name: "Form Validation Kit", owner: "Maya", status: "Stable", adoption: 88 },
  { id: "c-104", name: "Navigation Shell", owner: "Kiran", status: "Experiment", adoption: 69 },
  { id: "c-105", name: "Feedback Alerts", owner: "Asha", status: "Stable", adoption: 95 },
];

function classNames(...names) {
  return names.filter(Boolean).join(" ");
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createSeedSeries(pointCount) {
  let value = 58;
  return Array.from({ length: pointCount }, (_, index) => {
    value = clamp(value + (Math.random() * 20 - 10), 15, 92);
    return {
      id: index + 1,
      value: Math.round(value),
    };
  });
}

function createLineGeometry(points) {
  const width = 520;
  const height = 220;
  const padding = 22;
  const range = CHART_MAX - CHART_MIN;
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const nodes = points.map((point, index) => {
    const x = padding + index * stepX;
    const ratio = (point.value - CHART_MIN) / range;
    const y = height - padding - ratio * (height - padding * 2);
    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = nodes
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const baselineY = height - padding;
  const areaPath = linePath
    ? `${linePath} L ${nodes[nodes.length - 1].x} ${baselineY} L ${nodes[0].x} ${baselineY} Z`
    : "";

  return {
    width,
    height,
    padding,
    nodes,
    linePath,
    areaPath,
  };
}

function GradientButtonDemo({ values }) {
  const toneClassMap = {
    teal: "demo-gradient-button--teal",
    sunset: "demo-gradient-button--sunset",
    slate: "demo-gradient-button--slate",
  };

  return (
    <button
      type="button"
      className={classNames("demo-gradient-button", toneClassMap[values.tone] || toneClassMap.teal)}
      disabled={Boolean(values.disabled)}
    >
      {values.label || "Deploy Component"}
    </button>
  );
}

function GlassCardDemo({ values }) {
  return (
    <article className={classNames("demo-glass-card", values.elevated ? "demo-glass-card--elevated" : "")}>
      <h3>{values.title || "Component Spotlight"}</h3>
      <p>{values.description || "Reusable card shell with clean typography and soft depth."}</p>
    </article>
  );
}

function NeonInputDemo({ values }) {
  const statusClassMap = {
    neutral: "demo-neon-input--neutral",
    success: "demo-neon-input--success",
    error: "demo-neon-input--error",
  };

  return (
    <div className={classNames("demo-neon-input-wrap", statusClassMap[values.status] || statusClassMap.neutral)}>
      <input
        className="demo-neon-input"
        type="text"
        placeholder={values.placeholder || "Type your component query"}
        disabled={Boolean(values.disabled)}
      />
      <span>{values.status === "error" ? "Needs validation" : "Ready for input"}</span>
    </div>
  );
}

function AnimatedNavbarDemo({ values }) {
  const activeIndex = clamp(Number(values.activeIndex || 0), 0, NAV_LINKS.length - 1);
  return (
    <nav className="demo-nav" aria-label="Interactive navbar demo">
      {NAV_LINKS.map((link, index) => (
        <button
          key={link}
          type="button"
          className={index === activeIndex ? "active" : ""}
        >
          {link}
        </button>
      ))}
      {values.showCta ? (
        <button type="button" className="demo-nav-cta">
          Get Started
        </button>
      ) : null}
    </nav>
  );
}

function ToastNotificationDemo({ values }) {
  const tone = values.tone || "success";
  return (
    <div className={classNames("demo-toast", `demo-toast--${tone}`)} role="status" aria-live="polite">
      {values.showIcon ? <span className="demo-toast-icon" aria-hidden="true">!</span> : null}
      <p>{values.message || "Component saved successfully."}</p>
    </div>
  );
}

function ProfileCardDemo({ values }) {
  const availabilityMap = {
    available: "demo-profile-status--available",
    busy: "demo-profile-status--busy",
    away: "demo-profile-status--away",
  };

  return (
    <article className="demo-profile-card">
      <div className="demo-profile-avatar" aria-hidden="true" />
      <h3>{values.name || "Team Engineer"}</h3>
      <p>{values.role || "UI Component Engineer"}</p>
      <span className={classNames("demo-profile-status", availabilityMap[values.availability] || availabilityMap.available)}>
        {values.availability || "available"}
      </span>
    </article>
  );
}

function AccessibleModalDemo({ values }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="demo-modal-shell">
      <button type="button" className="demo-modal-open" onClick={() => setIsOpen(true)}>
        {values.openLabel || "Open Modal"}
      </button>
      {isOpen ? (
        <div className="demo-modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            className="demo-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="demo-modal-title">{values.title || "Accessible Modal"}</h3>
            <p>Keyboard escape, backdrop click, and action button all close this dialog.</p>
            <div className="demo-modal-actions">
              <button type="button" onClick={() => setIsOpen(false)}>
                {values.confirmText || "Understood"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function StatefulAccordionDemo({ values }) {
  const items = useMemo(
    () => [
      {
        id: "a1",
        title: "What is controlled state?",
        content: "State stored in React lets us keep behavior predictable and testable.",
      },
      {
        id: "a2",
        title: "Why modular components?",
        content: "Reusable pieces speed up delivery and keep design patterns consistent.",
      },
      {
        id: "a3",
        title: "How does conditional rendering help?",
        content: "It lets UI react to data, role permissions, and loading/error states.",
      },
    ],
    []
  );
  const [openIds, setOpenIds] = useState(["a1"]);
  const allowMultiple = Boolean(values.allowMultiple);
  const allowCollapse = Boolean(values.allowCollapse);

  const toggle = (itemId) => {
    setOpenIds((previous) => {
      const isOpen = previous.includes(itemId);
      if (isOpen) {
        if (!allowCollapse && previous.length === 1) {
          return previous;
        }
        return previous.filter((value) => value !== itemId);
      }
      if (!allowMultiple) {
        return [itemId];
      }
      return [...previous, itemId];
    });
  };

  return (
    <div className="demo-accordion">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <section key={item.id} className="demo-accordion-item">
            <button type="button" onClick={() => toggle(item.id)} aria-expanded={isOpen}>
              {item.title}
            </button>
            {isOpen ? <p>{item.content}</p> : null}
          </section>
        );
      })}
    </div>
  );
}

function DerivedTabsDemo({ values }) {
  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview", content: "High-level behavior and architectural intent." },
      { id: "props", label: "Props", content: "Configurable inputs for controlled rendering and styling." },
      { id: "states", label: "States", content: "Loading, success, empty, and error examples." },
    ],
    []
  );
  const [activeId, setActiveId] = useState("overview");
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeId) || tabs[0], [activeId, tabs]);
  const style = values.style === "pill" ? "demo-tabs--pill" : "demo-tabs--line";

  return (
    <div className={classNames("demo-tabs", style)}>
      <div className="demo-tabs-list" role="tablist" aria-label="Demo tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            className={activeId === tab.id ? "active" : ""}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section role="tabpanel" className="demo-tabs-panel">
        {activeTab.content}
      </section>
    </div>
  );
}

function DataTableDemo({ values }) {
  const [sortConfig, setSortConfig] = useState({ key: "adoption", direction: "desc" });
  const [selectedById, setSelectedById] = useState({});
  const threshold = clamp(Number(values.highlightThreshold || 80), 0, 100);
  const enableSelection = Boolean(values.enableSelection);

  useEffect(() => {
    if (!enableSelection) {
      setSelectedById({});
    }
  }, [enableSelection]);

  const rows = useMemo(() => {
    const copy = [...TABLE_ROWS];
    copy.sort((left, right) => {
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];
      if (leftValue === rightValue) {
        return 0;
      }
      const ascending = leftValue > rightValue ? 1 : -1;
      return sortConfig.direction === "asc" ? ascending : -ascending;
    });
    return copy;
  }, [sortConfig]);

  const selectedCount = Object.values(selectedById).filter(Boolean).length;

  const toggleSort = (key) => {
    setSortConfig((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: key === "adoption" ? "desc" : "asc",
      };
    });
  };

  const toggleRowSelection = (rowId) => {
    setSelectedById((previous) => ({
      ...previous,
      [rowId]: !previous[rowId],
    }));
  };

  const densityClass = values.density === "compact" ? "demo-table--compact" : "";

  return (
    <div className="demo-table-container">
      <div className="demo-table-meta">
        <span>{rows.length} components</span>
        {enableSelection ? <span>{selectedCount} selected</span> : null}
      </div>
      <div className="demo-table-scroll">
        <table className={classNames("demo-table", densityClass)}>
          <thead>
            <tr>
              {enableSelection ? <th scope="col">Select</th> : null}
              <th scope="col">
                <button type="button" onClick={() => toggleSort("name")}>
                  Component
                </button>
              </th>
              <th scope="col">
                <button type="button" onClick={() => toggleSort("owner")}>
                  Owner
                </button>
              </th>
              <th scope="col">
                <button type="button" onClick={() => toggleSort("status")}>
                  Status
                </button>
              </th>
              <th scope="col">
                <button type="button" onClick={() => toggleSort("adoption")}>
                  Adoption %
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.adoption >= threshold ? "demo-row--highlight" : ""}>
                {enableSelection ? (
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedById[row.id])}
                      onChange={() => toggleRowSelection(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                ) : null}
                <td>{row.name}</td>
                <td>{row.owner}</td>
                <td>{row.status}</td>
                <td>{row.adoption}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LiveLineChartDemo({ values }) {
  const pointCount = clamp(Number(values.pointCount || 8), 6, 16);
  const threshold = clamp(Number(values.threshold || 70), CHART_MIN, CHART_MAX);
  const autoUpdate = Boolean(values.autoUpdate);
  const [points, setPoints] = useState(() => createSeedSeries(pointCount));

  useEffect(() => {
    setPoints(createSeedSeries(pointCount));
  }, [pointCount]);

  useEffect(() => {
    if (!autoUpdate) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setPoints((previous) => {
        const lastValue = previous[previous.length - 1]?.value ?? 58;
        const nextValue = Math.round(clamp(lastValue + (Math.random() * 14 - 7), 12, 96));
        const nextPoint = {
          id: (previous[previous.length - 1]?.id ?? 0) + 1,
          value: nextValue,
        };
        return [...previous.slice(-pointCount + 1), nextPoint];
      });
    }, 1200);

    return () => window.clearInterval(timerId);
  }, [autoUpdate, pointCount]);

  const chart = useMemo(() => createLineGeometry(points), [points]);
  const latest = points[points.length - 1]?.value ?? 0;
  const previous = points[points.length - 2]?.value ?? latest;
  const delta = latest - previous;
  const thresholdY =
    chart.height -
    chart.padding -
    ((threshold - CHART_MIN) / (CHART_MAX - CHART_MIN)) * (chart.height - chart.padding * 2);

  return (
    <div className="demo-chart-shell">
      <div className="demo-chart-meta">
        <strong>{latest}%</strong>
        <span className={delta >= 0 ? "demo-chart-delta" : "demo-chart-delta demo-chart-delta--down"}>
          {delta >= 0 ? `+${delta}` : `${delta}`} since last tick
        </span>
      </div>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="demo-chart" role="img" aria-label="Live chart demo">
        <line
          x1={chart.padding}
          y1={thresholdY}
          x2={chart.width - chart.padding}
          y2={thresholdY}
          className="demo-chart-threshold"
        />
        <path d={chart.areaPath} className="demo-chart-area" />
        <path d={chart.linePath} className="demo-chart-line" />
        {chart.nodes.map((node) => (
          <circle key={node.id} cx={node.x} cy={node.y} r="3" className="demo-chart-node" />
        ))}
      </svg>
      <div className="demo-chart-footer">
        <span>Threshold: {threshold}%</span>
        <span>{autoUpdate ? "Async feed running" : "Async feed paused"}</span>
      </div>
    </div>
  );
}

const SHOWCASE_DEMOS = {
  "gradient-button": {
    summary: "Configure button content and visual state for production-ready interactions.",
    controls: [
      { id: "label", label: "Button Text", type: "text", defaultValue: "Deploy Component" },
      {
        id: "tone",
        label: "Visual Theme",
        type: "select",
        defaultValue: "teal",
        options: [
          { label: "Teal", value: "teal" },
          { label: "Sunset", value: "sunset" },
          { label: "Slate", value: "slate" },
        ],
      },
      { id: "disabled", label: "Disable Action", type: "checkbox", defaultValue: false },
    ],
    Component: GradientButtonDemo,
  },
  "glass-card": {
    summary: "Control content and elevation style for card design variants.",
    controls: [
      { id: "title", label: "Card Title", type: "text", defaultValue: "Component Spotlight" },
      {
        id: "description",
        label: "Card Description",
        type: "textarea",
        defaultValue: "Reusable card shell with clean typography and soft depth.",
      },
      { id: "elevated", label: "Enable Elevated Shadow", type: "checkbox", defaultValue: true },
    ],
    Component: GlassCardDemo,
  },
  "neon-input": {
    summary: "Set input placeholder and validation state for form feedback scenarios.",
    controls: [
      { id: "placeholder", label: "Placeholder Text", type: "text", defaultValue: "Search components..." },
      {
        id: "status",
        label: "Validation State",
        type: "select",
        defaultValue: "neutral",
        options: [
          { label: "Neutral", value: "neutral" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
      { id: "disabled", label: "Disable Input", type: "checkbox", defaultValue: false },
    ],
    Component: NeonInputDemo,
  },
  "animated-navbar": {
    summary: "Define active navigation state and optional primary call-to-action.",
    controls: [
      {
        id: "activeIndex",
        label: "Active Navigation Item",
        type: "select",
        defaultValue: "0",
        options: NAV_LINKS.map((label, index) => ({ label, value: String(index) })),
      },
      { id: "showCta", label: "Show Primary CTA", type: "checkbox", defaultValue: true },
    ],
    Component: AnimatedNavbarDemo,
  },
  "toast-notification": {
    summary: "Configure message style and priority indicator for status feedback.",
    controls: [
      { id: "message", label: "Notification Message", type: "text", defaultValue: "Component saved successfully." },
      {
        id: "tone",
        label: "Notification Type",
        type: "select",
        defaultValue: "success",
        options: [
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
          { label: "Info", value: "info" },
        ],
      },
      { id: "showIcon", label: "Show Status Icon", type: "checkbox", defaultValue: true },
    ],
    Component: ToastNotificationDemo,
  },
  "profile-card": {
    summary: "Set profile metadata and availability state for team directory use cases.",
    controls: [
      { id: "name", label: "Display Name", type: "text", defaultValue: "Team Engineer" },
      { id: "role", label: "Job Title", type: "text", defaultValue: "UI Component Engineer" },
      {
        id: "availability",
        label: "Availability Status",
        type: "select",
        defaultValue: "available",
        options: [
          { label: "Available", value: "available" },
          { label: "Busy", value: "busy" },
          { label: "Away", value: "away" },
        ],
      },
    ],
    Component: ProfileCardDemo,
  },
  "accessible-modal": {
    summary: "Validate keyboard and overlay-close behavior for accessible dialog workflows.",
    controls: [
      { id: "openLabel", label: "Launch Button Text", type: "text", defaultValue: "Open Modal" },
      { id: "title", label: "Dialog Title", type: "text", defaultValue: "Accessible Modal" },
      { id: "confirmText", label: "Primary Action Text", type: "text", defaultValue: "Understood" },
    ],
    Component: AccessibleModalDemo,
  },
  "stateful-accordion": {
    summary: "Define expansion policy for single or multi-panel disclosure behavior.",
    controls: [
      { id: "allowMultiple", label: "Enable Multiple Open Panels", type: "checkbox", defaultValue: false },
      { id: "allowCollapse", label: "Allow All Panels Collapsed", type: "checkbox", defaultValue: true },
    ],
    Component: StatefulAccordionDemo,
  },
  "derived-state-tabs": {
    summary: "Switch tab visual treatment for design-system comparison.",
    controls: [
      {
        id: "style",
        label: "Tab Style Variant",
        type: "select",
        defaultValue: "line",
        options: [
          { label: "Line", value: "line" },
          { label: "Pill", value: "pill" },
        ],
      },
    ],
    Component: DerivedTabsDemo,
  },
  "data-table": {
    summary: "Configure table density and row-highlighting criteria for analytics views.",
    controls: [
      {
        id: "density",
        label: "Row Density",
        type: "select",
        defaultValue: "cozy",
        options: [
          { label: "Cozy", value: "cozy" },
          { label: "Compact", value: "compact" },
        ],
      },
      {
        id: "highlightThreshold",
        label: "Highlight Threshold (Adoption %)",
        type: "range",
        min: 60,
        max: 100,
        step: 1,
        defaultValue: 85,
      },
      { id: "enableSelection", label: "Enable Row Selection", type: "checkbox", defaultValue: true },
    ],
    Component: DataTableDemo,
  },
  "live-line-chart": {
    summary: "Simulate streaming telemetry with configurable chart window and alert threshold.",
    controls: [
      { id: "autoUpdate", label: "Enable Live Data Feed", type: "checkbox", defaultValue: true },
      {
        id: "pointCount",
        label: "Visible Data Points",
        type: "range",
        min: 6,
        max: 16,
        step: 1,
        defaultValue: 9,
      },
      {
        id: "threshold",
        label: "Alert Threshold (%)",
        type: "range",
        min: 35,
        max: 90,
        step: 1,
        defaultValue: 70,
      },
    ],
    Component: LiveLineChartDemo,
  },
};

export function getShowcaseDemo(componentId) {
  return SHOWCASE_DEMOS[componentId] || null;
}
