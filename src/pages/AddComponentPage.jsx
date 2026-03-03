import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { categories } from "@/data/components.data";
import { canAccessAddComponent, getAuthUser } from "@/services/authAccess";
import { addCustomComponent } from "@/services/componentsStore";
import "./AddComponentPage.css";

const INITIAL_FORM = {
  name: "",
  description: "",
  jsxCode: "",
  cssCode: "",
  category: "",
  thumbnail: "",
  screenshot: "",
};

const isValidImageUrl = (value) => {
  if (!value.trim()) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const AddComponentPage = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { name, description, jsxCode, cssCode, category, thumbnail, screenshot } = formValues;
  const isValid = Boolean(
    name.trim() &&
      description.trim() &&
      jsxCode.trim() &&
      cssCode.trim() &&
      category.trim() &&
      isValidImageUrl(thumbnail) &&
      isValidImageUrl(screenshot)
  );
  const canAddComponent = canAccessAddComponent(getAuthUser());

  const availableCategories = useMemo(
    () => categories.filter((category) => category.id !== "all"),
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (value.trim() !== "") {
      setErrors((previous) => ({
        ...previous,
        [name]: name === "thumbnail" || name === "screenshot" ? !isValidImageUrl(value) : false,
      }));
      return;
    }

    setErrors((previous) => ({
      ...previous,
      [name]: false,
    }));
  };

  const validate = () => {
    const nextErrors = {
      name: formValues.name.trim() === "",
      description: formValues.description.trim() === "",
      jsxCode: formValues.jsxCode.trim() === "",
      cssCode: formValues.cssCode.trim() === "",
      category: formValues.category.trim() === "",
      thumbnail: !isValidImageUrl(formValues.thumbnail),
      screenshot: !isValidImageUrl(formValues.screenshot),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    addCustomComponent(formValues);
    navigate("/", { replace: true });
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
            />
            {errors.name ? <span className="field-error">Name is required.</span> : null}

            <label htmlFor="component-description">Description</label>
            <textarea
              id="component-description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              rows={3}
              className={errors.description ? "error" : ""}
            />
            {errors.description ? (
              <span className="field-error">Description is required.</span>
            ) : null}

            <label htmlFor="component-category">Category</label>
            <select
              id="component-category"
              name="category"
              value={formValues.category}
              onChange={handleChange}
              className={errors.category ? "error" : ""}
            >
              <option value="">Select a category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? (
              <span className="field-error">Category is required.</span>
            ) : null}

            <label htmlFor="component-display-image">Display Image URL</label>
            <input
              id="component-display-image"
              name="thumbnail"
              type="url"
              value={formValues.thumbnail}
              onChange={handleChange}
              className={errors.thumbnail ? "error" : ""}
              placeholder="https://example.com/display-image.png"
            />
            {errors.thumbnail ? (
              <span className="field-error">Please enter a valid http(s) URL.</span>
            ) : null}

            <label htmlFor="component-preview-image">Code Preview Image URL</label>
            <input
              id="component-preview-image"
              name="screenshot"
              type="url"
              value={formValues.screenshot}
              onChange={handleChange}
              className={errors.screenshot ? "error" : ""}
              placeholder="https://example.com/code-preview-image.png"
            />
            {errors.screenshot ? (
              <span className="field-error">Please enter a valid http(s) URL.</span>
            ) : null}

            <label htmlFor="component-jsx">JSX Code</label>
            <textarea
              id="component-jsx"
              name="jsxCode"
              value={formValues.jsxCode}
              onChange={handleChange}
              rows={8}
              className={errors.jsxCode ? "error" : ""}
            />
            {errors.jsxCode ? <span className="field-error">JSX code is required.</span> : null}

            <label htmlFor="component-css">CSS Code</label>
            <textarea
              id="component-css"
              name="cssCode"
              value={formValues.cssCode}
              onChange={handleChange}
              rows={8}
              className={errors.cssCode ? "error" : ""}
            />
            {errors.cssCode ? <span className="field-error">CSS code is required.</span> : null}

            <button
              type="submit"
              className="add-component-submit"
              disabled={!isValid}
            >
              Add Component
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddComponentPage;
