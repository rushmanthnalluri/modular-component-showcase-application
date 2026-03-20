import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CodeBlock from "@/components/CodeBlock";
import ComponentPlayground from "@/components/ComponentPlayground";

import Layout from "@/components/Layout";

import { deleteComponent } from "@/services/componentsStore";
import { subscribeToAuthUser } from "@/services/authAccess";
import "./ComponentDetails.css";

function parseDemoControlValue(control, rawValue) {
  if (rawValue === null) {
    return control.defaultValue;
  }

  if (control.type === "checkbox") {
    return rawValue === "true";
  }

  if (control.type === "number" || control.type === "range") {
    const parsed = Number(rawValue);
    const fallback = Number(control.defaultValue);
    const resolvedValue = Number.isFinite(parsed) ? parsed : fallback;
    const minimum = Number(control.min);
    const maximum = Number(control.max);

    if (Number.isFinite(minimum) && resolvedValue < minimum) {
      return minimum;
    }

    if (Number.isFinite(maximum) && resolvedValue > maximum) {
      return maximum;
    }

    return resolvedValue;
  }

  return rawValue;
}

function serializeDemoControlValue(control, value) {
  if (control.type === "checkbox") {
    return value ? "true" : "false";
  }

  if (control.type === "number" || control.type === "range") {
    const numericValue = Number(value);
    return String(Number.isFinite(numericValue) ? numericValue : Number(control.defaultValue));
  }

  return String(value ?? "");
}

function readDemoValuesFromSearchParams(controls, searchParams) {
  return controls.reduce((accumulator, control) => {
    accumulator[control.id] = parseDemoControlValue(
      control,
      searchParams.get(`demo_${control.id}`)
    );
    return accumulator;
  }, {});
}

function areObjectsEqual(leftObject, rightObject) {
  const keySet = new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]);

  for (const key of keySet) {
    if (leftObject[key] !== rightObject[key]) {
      return false;
    }
  }

  return true;
}

function toPascalIdentifier(value) {
  const normalized = String(value || "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join("");

  return normalized || "ComponentDemo";
}

function formatGeneratedValue(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value ?? null);
}

function buildGeneratedDemoCode(componentName, controls, values) {
  const componentIdentifier = toPascalIdentifier(componentName);
  const configIdentifier = `${componentIdentifier}Props`;
  const configLines = controls.map((control) => {
    const resolvedValue = Object.prototype.hasOwnProperty.call(values, control.id)
      ? values[control.id]
      : control.defaultValue;
    return `  ${control.id}: ${formatGeneratedValue(resolvedValue)},`;
  });

  return `const ${configIdentifier} = {
${configLines.join("\n")}
};

export default function Example() {
  return <${componentIdentifier} {...${configIdentifier}} />;
}`;
}

const ComponentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("jsx");
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [demoValues, setDemoValues] = useState({});
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => subscribeToAuthUser(setAuthUser), []);

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      setIsLoading(true);
      const component = await fetchComponentById(id);

      if (isMounted) {
        setItem(component);
        setIsLoading(false);
      }
    };

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    setPreviewSrc(item?.screenshot || item?.thumbnail || "");
  }, [item]);

  const demoDefinition = useMemo(() => getShowcaseDemo(item?.id || ""), [item?.id]);
  const demoControls = useMemo(() => demoDefinition?.controls ?? [], [demoDefinition]);
  const hasGeneratedTab = demoControls.length > 0;
  const hasCssCode = Boolean(item?.code?.css);
  const tabOrder = useMemo(() => {
    const tabs = ["jsx"];
    if (hasCssCode) {
      tabs.push("css");
    }
    if (hasGeneratedTab) {
      tabs.push("generated");
    }
    return tabs;
  }, [hasCssCode, hasGeneratedTab]);

  useEffect(() => {
    if (!hasGeneratedTab) {
      setDemoValues({});
      return;
    }

    const parsedValues = readDemoValuesFromSearchParams(demoControls, searchParams);
    setDemoValues((previous) => (areObjectsEqual(previous, parsedValues) ? previous : parsedValues));
  }, [demoControls, hasGeneratedTab, searchParams]);

  useEffect(() => {
    if (!hasGeneratedTab || Object.keys(demoValues).length === 0) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    for (const key of [...nextParams.keys()]) {
      if (key.startsWith("demo_")) {
        nextParams.delete(key);
      }
    }

    demoControls.forEach((control) => {
      const serializedValue = serializeDemoControlValue(control, demoValues[control.id]);
      const serializedDefault = serializeDemoControlValue(control, control.defaultValue);

      if (serializedValue !== serializedDefault) {
        nextParams.set(`demo_${control.id}`, serializedValue);
      }
    });

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [demoControls, demoValues, hasGeneratedTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === "generated" && !hasGeneratedTab) {
      setActiveTab("jsx");
      return;
    }

    if (activeTab === "css" && !hasCssCode) {
      setActiveTab("jsx");
    }
  }, [activeTab, hasGeneratedTab, hasCssCode]);

  const generatedDemoCode = useMemo(() => {
    if (!item || !hasGeneratedTab) {
      return "// Generated code is available for interactive demos.";
    }

    return buildGeneratedDemoCode(item.name, demoControls, demoValues);
  }, [demoControls, demoValues, hasGeneratedTab, item]);

  const previewModeLabel = hasGeneratedTab ? "Interactive Demo" : "Code Preview";
  const activeTabId = `component-tab-${activeTab}`;
  const activePanelId = `component-panel-${activeTab}`;

  const handleTabKeyDown = (event, currentTab) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % tabOrder.length
        : (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    setActiveTab(tabOrder[nextIndex]);
  };

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = window.location.href;
    if (!navigator?.clipboard?.writeText) {
      window.prompt("Copy this URL", shareUrl);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1500);
    } catch {
      window.prompt("Copy this URL", shareUrl);
    }
  };

  const handlePreviewError = () => {
    if (item?.thumbnail && previewSrc !== item.thumbnail) {
      setPreviewSrc(item.thumbnail);
      return;
    }
    setPreviewSrc("");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteComponent(item.id);
      navigate("/", { replace: true });
    } catch {
      setIsDeleting(false);
    }
  };

  const canDelete = Boolean(
    authUser && item && (authUser.id === item.createdBy || authUser.role === "admin")
  );

  if (!item) {
    if (isLoading) {
      return (
        <Layout>
          <div className="layout-container details-state">
            <h2>Loading component...</h2>
          </div>
        </Layout>
      );
    }

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
          <span
            className={hasGeneratedTab ? "component-mode-badge component-mode-badge--interactive" : "component-mode-badge"}
          >
            {previewModeLabel}
          </span>
          {canDelete && (
            <button
              type="button"
              className="component-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Component"}
            </button>
          )}
        </div>
        <p className="details-desc">{item.description}</p>
        <div className="details-grid">
          <div className="preview-box">
            <div className="preview-head">
              <span>Live Interactive Demo</span>
              <button
                type="button"
                className="preview-share-btn"
                onClick={handleCopyShareLink}
                aria-label="Copy share link with current demo settings"
              >
                {shareCopied ? "Link Copied" : "Copy Share Link"}
              </button>
            </div>
            <div className={hasGeneratedTab ? "preview-body preview-body--playground" : "preview-body"}>
              <ComponentPlayground
                componentId={item.id}
                componentName={item.name}
                fallbackSrc={previewSrc}
                onFallbackError={handlePreviewError}
                values={demoValues}
                onValuesChange={setDemoValues}
              />
            </div>
          </div>

          <div className="code-pane">
            <div className="code-tabs" role="tablist" aria-label="Component source code tabs">
              <button
                type="button"
                className={activeTab === "jsx" ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab("jsx")}
                aria-label="Show JSX code tab"
                role="tab"
                id="component-tab-jsx"
                aria-selected={activeTab === "jsx"}
                aria-controls="component-panel-jsx"
                tabIndex={activeTab === "jsx" ? 0 : -1}
                onKeyDown={(event) => handleTabKeyDown(event, "jsx")}
              >
                JSX
              </button>
              {hasCssCode ? (
                <button
                  type="button"
                  className={activeTab === "css" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveTab("css")}
                  aria-label="Show CSS code tab"
                  role="tab"
                  id="component-tab-css"
                  aria-selected={activeTab === "css"}
                  aria-controls="component-panel-css"
                  tabIndex={activeTab === "css" ? 0 : -1}
                  onKeyDown={(event) => handleTabKeyDown(event, "css")}
                >
                  CSS
                </button>
              ) : null}
              {hasGeneratedTab ? (
                <button
                  type="button"
                  className={activeTab === "generated" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveTab("generated")}
                  aria-label="Show generated code tab"
                  role="tab"
                  id="component-tab-generated"
                  aria-selected={activeTab === "generated"}
                  aria-controls="component-panel-generated"
                  tabIndex={activeTab === "generated" ? 0 : -1}
                  onKeyDown={(event) => handleTabKeyDown(event, "generated")}
                >
                  Generated
                </button>
              ) : null}
            </div>

            <div role="tabpanel" id={activePanelId} aria-labelledby={activeTabId}>
              {activeTab === "jsx" ? (
                <>
                  {/* Declarative tab rendering: active state decides which code block is shown. */}
                  <CodeBlock code={item.code.jsx} language="jsx" />
                </>
              ) : activeTab === "css" ? (
                <CodeBlock code={item.code.css || ""} language="css" />
              ) : (
                <CodeBlock code={generatedDemoCode} language="jsx" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComponentDetail;
