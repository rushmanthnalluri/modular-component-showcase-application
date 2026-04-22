import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { categories } from "@/data/components.data";
import { canAccessAddComponent, getAuthUser } from "@/services/authAccess";
import { addCustomComponent } from "@/services/componentsStore";
import "./AddComponentPage.css";

const INITIAL_FORM = {
  name: "",
  description: "",
  descriptionMarkdown: "",
  tags: "",
  jsxCode: "",
  cssCode: "",
  category: "",
  thumbnail: "",
  screenshot: "",
  propsText: "",
  bestPracticesText: "",
  commonPitfallsText: "",
  usageExampleTitle: "",
  usageExampleDescription: "",
  usageExampleCode: "",
  reactImport: "",
  typescriptImport: "",
  npmInstall: "",
  dependenciesText: "",
  relatedComponentsText: "",
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

function parseLineList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePropsText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", type = "", defaultValue = "", requiredValue = "", description = ""] = line
        .split("|")
        .map((part) => part.trim());

      if (!name) {
        return null;
      }

      return {
        name,
        type,
        default: defaultValue,
        required: /^(required|true|yes|y)$/i.test(requiredValue),
        description,
      };
    })
    .filter(Boolean);
}

function buildUsageExamples(values) {
  const title = values.usageExampleTitle.trim();
  const description = values.usageExampleDescription.trim();
  const code = values.usageExampleCode.trim();

  if (!title && !description && !code) {
    return [];
  }

  return [
    {
      title,
      description,
      code,
    },
  ];
}

function buildSubmissionPayload(values) {
  const reactImport = values.reactImport.trim();
  const typescriptImport = values.typescriptImport.trim();
  const npmInstall = values.npmInstall.trim();

  return {
    name: values.name,
    description: values.description,
    descriptionMarkdown: values.descriptionMarkdown,
    tags: values.tags,
    jsxCode: values.jsxCode,
    cssCode: values.cssCode,
    category: values.category,
    thumbnail: values.thumbnail,
    screenshot: values.screenshot,
    props: parsePropsText(values.propsText),
    usageExamples: buildUsageExamples(values),
    bestPractices: parseLineList(values.bestPracticesText),
    commonPitfalls: parseLineList(values.commonPitfallsText),
    dependencies: parseLineList(values.dependenciesText),
    relatedComponents: parseLineList(values.relatedComponentsText),
    importStatements: {
      ...(reactImport ? { standard: reactImport } : {}),
      ...(typescriptImport ? { typescript: typescriptImport } : {}),
      ...(npmInstall ? { npm: npmInstall } : {}),
    },
  };
}

const AddComponentPage = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [fileNames, setFileNames] = useState({ thumbnail: "", screenshot: "" });
  const [submitError, setSubmitError] = useState("");
  const canAddComponent = useMemo(() => canAccessAddComponent(getAuthUser()), []);
  const { name, description, jsxCode, category } = formValues;

  const isValid = Boolean(name.trim() && description.trim() && jsxCode.trim() && category.trim());

  const availableCategories = useMemo(
    () => categories.filter((categoryItem) => categoryItem.id !== "all"),
    []
  );

  const handleChange = (event) => {
    const { name: fieldName, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [fieldName]: false,
    }));
  };

  const handleFileChange = async (event) => {
    const { name: fieldName, files } = event.target;
    const selectedFile = files?.[0];

    if (!selectedFile) {
      setFormValues((previous) => ({
        ...previous,
        [fieldName]: "",
      }));
      setFileNames((previous) => ({
        ...previous,
        [fieldName]: "",
      }));
      setErrors((previous) => ({
        ...previous,
        [fieldName]: false,
      }));
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        [fieldName]: true,
      }));
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(selectedFile);
      setFormValues((previous) => ({
        ...previous,
        [fieldName]: imageDataUrl,
      }));
      setFileNames((previous) => ({
        ...previous,
        [fieldName]: selectedFile.name,
      }));
      setErrors((previous) => ({
        ...previous,
        [fieldName]: false,
      }));
    } catch {
      setErrors((previous) => ({
        ...previous,
        [fieldName]: true,
      }));
    }
  };

  const validate = () => {
    const nextErrors = {
      name: formValues.name.trim() === "",
      description: formValues.description.trim() === "",
      tags: false,
      jsxCode: formValues.jsxCode.trim() === "",
      cssCode: false,
      category: formValues.category.trim() === "",
      thumbnail: false,
      screenshot: false,
      descriptionMarkdown: false,
      propsText: false,
      bestPracticesText: false,
      commonPitfallsText: false,
      usageExampleTitle: false,
      usageExampleDescription: false,
      usageExampleCode: false,
      reactImport: false,
      typescriptImport: false,
      npmInstall: false,
      dependenciesText: false,
      relatedComponentsText: false,
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) {
      return;
    }

    try {
      await addCustomComponent(buildSubmissionPayload(formValues));
      navigate("/", { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to save component right now.");
    }
  };

  if (!canAddComponent) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="layout-container add-component-page">
        <div className="add-component-card">
          <h1>Add Component</h1>
          <p>Submit a new reusable component to the showcase list.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="component-name">Name</label>
            <input
              id="component-name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "component-name-error" : undefined}
              required
            />
            {errors.name ? (
              <span id="component-name-error" className="field-error">
                Name is required.
              </span>
            ) : null}

            <label htmlFor="component-description">Description</label>
            <textarea
              id="component-description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              rows={3}
              className={errors.description ? "error" : ""}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "component-description-error" : undefined}
              required
            />
            {errors.description ? (
              <span id="component-description-error" className="field-error">
                Description is required.
              </span>
            ) : null}

            <label htmlFor="component-category">Category</label>
            <select
              id="component-category"
              name="category"
              value={formValues.category}
              onChange={handleChange}
              className={errors.category ? "error" : ""}
              aria-invalid={errors.category ? "true" : "false"}
              aria-describedby={errors.category ? "component-category-error" : undefined}
              required
            >
              <option value="">Select a category</option>
              {availableCategories.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.id}>
                  {categoryItem.name}
                </option>
              ))}
            </select>
            {errors.category ? (
              <span id="component-category-error" className="field-error">
                Category is required.
              </span>
            ) : null}

            <label htmlFor="component-tags">Tags (comma-separated)</label>
            <input
              id="component-tags"
              name="tags"
              value={formValues.tags}
              onChange={handleChange}
              className={errors.tags ? "error" : ""}
              aria-invalid={errors.tags ? "true" : "false"}
              placeholder="e.g. responsive, dark-mode, form"
            />

            <label htmlFor="component-display-image">Display Image File</label>
            <input
              id="component-display-image"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={errors.thumbnail ? "error" : ""}
              aria-invalid={errors.thumbnail ? "true" : "false"}
              aria-describedby={errors.thumbnail ? "component-thumbnail-error" : undefined}
            />
            {fileNames.thumbnail ? <span className="field-help">{fileNames.thumbnail}</span> : null}
            {errors.thumbnail ? (
              <span id="component-thumbnail-error" className="field-error">
                Please select a valid image file.
              </span>
            ) : null}

            <label htmlFor="component-preview-image">Code Preview Image File</label>
            <input
              id="component-preview-image"
              name="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={errors.screenshot ? "error" : ""}
              aria-invalid={errors.screenshot ? "true" : "false"}
              aria-describedby={errors.screenshot ? "component-screenshot-error" : undefined}
            />
            {fileNames.screenshot ? <span className="field-help">{fileNames.screenshot}</span> : null}
            {errors.screenshot ? (
              <span id="component-screenshot-error" className="field-error">
                Please select a valid image file.
              </span>
            ) : null}

            <label htmlFor="component-jsx">JSX Code</label>
            <textarea
              id="component-jsx"
              name="jsxCode"
              value={formValues.jsxCode}
              onChange={handleChange}
              rows={8}
              className={errors.jsxCode ? "error" : ""}
              aria-invalid={errors.jsxCode ? "true" : "false"}
              aria-describedby={errors.jsxCode ? "component-jsx-error" : undefined}
              required
            />
            {errors.jsxCode ? (
              <span id="component-jsx-error" className="field-error">
                JSX code is required.
              </span>
            ) : null}

            <label htmlFor="component-css">CSS Code</label>
            <textarea
              id="component-css"
              name="cssCode"
              value={formValues.cssCode}
              onChange={handleChange}
              rows={8}
              className={errors.cssCode ? "error" : ""}
              aria-invalid={errors.cssCode ? "true" : "false"}
              aria-describedby={errors.cssCode ? "component-css-error" : undefined}
            />
            {errors.cssCode ? (
              <span id="component-css-error" className="field-error">
                Invalid CSS code.
              </span>
            ) : null}

            <details className="optional-docs-panel">
              <summary>Optional documentation & guidance</summary>
              <p className="field-help optional-docs-intro">
                These fields power the detail page with practical usage notes instead of placeholders.
              </p>

              <label htmlFor="component-description-markdown">Expanded Notes</label>
              <textarea
                id="component-description-markdown"
                name="descriptionMarkdown"
                value={formValues.descriptionMarkdown}
                onChange={handleChange}
                rows={4}
                placeholder="Add setup notes, design intent, or implementation details."
              />

              <label htmlFor="component-props-text">Props Reference</label>
              <textarea
                id="component-props-text"
                name="propsText"
                value={formValues.propsText}
                onChange={handleChange}
                rows={5}
                placeholder={'label | string | "Deploy" | required | Primary call-to-action text'}
              />
              <span className="field-help">
                One prop per line: <code>name | type | default | required/optional | description</code>
              </span>

              <label htmlFor="component-best-practices">Best Practices</label>
              <textarea
                id="component-best-practices"
                name="bestPracticesText"
                value={formValues.bestPracticesText}
                onChange={handleChange}
                rows={4}
                placeholder={"Keep labels action-oriented\nPair loading states with disabled interactions"}
              />
              <span className="field-help">One tip per line.</span>

              <label htmlFor="component-common-pitfalls">Common Pitfalls</label>
              <textarea
                id="component-common-pitfalls"
                name="commonPitfallsText"
                value={formValues.commonPitfallsText}
                onChange={handleChange}
                rows={4}
                placeholder={"Avoid clickable div wrappers\nDo not rely on placeholder text as the only label"}
              />
              <span className="field-help">One caution per line.</span>

              <div className="optional-docs-grid">
                <div>
                  <label htmlFor="component-usage-title">Usage Example Title</label>
                  <input
                    id="component-usage-title"
                    name="usageExampleTitle"
                    value={formValues.usageExampleTitle}
                    onChange={handleChange}
                    placeholder="Primary CTA in a dashboard toolbar"
                  />
                </div>

                <div>
                  <label htmlFor="component-react-import">React Import Snippet</label>
                  <textarea
                    id="component-react-import"
                    name="reactImport"
                    value={formValues.reactImport}
                    onChange={handleChange}
                    rows={3}
                    placeholder={'import SolidButton from "@/components/SolidButton";\n\n<SolidButton />'}
                  />
                </div>

                <div>
                  <label htmlFor="component-typescript-import">TypeScript Import Snippet</label>
                  <textarea
                    id="component-typescript-import"
                    name="typescriptImport"
                    value={formValues.typescriptImport}
                    onChange={handleChange}
                    rows={3}
                    placeholder={'import type { ComponentProps } from "react";\nimport SolidButton from "@/components/SolidButton";'}
                  />
                </div>

                <div>
                  <label htmlFor="component-npm-install">Install Command</label>
                  <input
                    id="component-npm-install"
                    name="npmInstall"
                    value={formValues.npmInstall}
                    onChange={handleChange}
                    placeholder="npm install framer-motion"
                  />
                </div>
              </div>

              <label htmlFor="component-dependencies-text">External Dependencies</label>
              <textarea
                id="component-dependencies-text"
                name="dependenciesText"
                value={formValues.dependenciesText}
                onChange={handleChange}
                rows={3}
                placeholder={"framer-motion\nreact-aria"}
              />
              <span className="field-help">One package per line.</span>

              <label htmlFor="component-related-components">Related Components</label>
              <textarea
                id="component-related-components"
                name="relatedComponentsText"
                value={formValues.relatedComponentsText}
                onChange={handleChange}
                rows={3}
                placeholder={"SearchBar\nCommandPalette\nTagFilter"}
              />
              <span className="field-help">One related component per line.</span>

              <label htmlFor="component-usage-description">Usage Example Description</label>
              <textarea
                id="component-usage-description"
                name="usageExampleDescription"
                value={formValues.usageExampleDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Explain where this component works best and why."
              />

              <label htmlFor="component-usage-code">Usage Example Code</label>
              <textarea
                id="component-usage-code"
                name="usageExampleCode"
                value={formValues.usageExampleCode}
                onChange={handleChange}
                rows={6}
                placeholder={"<Toolbar>\n  <SolidButton>Deploy</SolidButton>\n</Toolbar>"}
              />
            </details>

            <button type="submit" className="add-component-submit" disabled={!isValid}>
              Add Component
            </button>
            {submitError ? <span className="field-error">{submitError}</span> : null}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddComponentPage;
