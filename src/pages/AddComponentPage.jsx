import { useEffect, useMemo, useState } from "react";
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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

const AddComponentPage = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [fileNames, setFileNames] = useState({ thumbnail: "", screenshot: "" });
  const [canAddComponent, setCanAddComponent] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const { name, description, jsxCode, cssCode, category } = formValues;
  const isValid = Boolean(
    name.trim() &&
      description.trim() &&
      jsxCode.trim() &&
      cssCode.trim() &&
      category.trim()
  );
  useEffect(() => {
    let isMounted = true;

    const loadAuthUser = async () => {
      const authUser = await getAuthUser();
      if (isMounted) {
        setCanAddComponent(canAccessAddComponent(authUser));
      }
    };

    loadAuthUser();

    return () => {
      isMounted = false;
    };
  }, []);

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

    setErrors((previous) => ({
      ...previous,
      [name]: false,
    }));
  };

  const handleFileChange = async (event) => {
    const { name, files } = event.target;
    const selectedFile = files?.[0];

    if (!selectedFile) {
      setFormValues((previous) => ({
        ...previous,
        [name]: "",
      }));
      setFileNames((previous) => ({
        ...previous,
        [name]: "",
      }));
      setErrors((previous) => ({
        ...previous,
        [name]: false,
      }));
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        [name]: true,
      }));
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(selectedFile);
      setFormValues((previous) => ({
        ...previous,
        [name]: imageDataUrl,
      }));
      setFileNames((previous) => ({
        ...previous,
        [name]: selectedFile.name,
      }));
      setErrors((previous) => ({
        ...previous,
        [name]: false,
      }));
    } catch {
      setErrors((previous) => ({
        ...previous,
        [name]: true,
      }));
    }
  };

  const validate = () => {
    const nextErrors = {
      name: formValues.name.trim() === "",
      description: formValues.description.trim() === "",
      jsxCode: formValues.jsxCode.trim() === "",
      cssCode: formValues.cssCode.trim() === "",
      category: formValues.category.trim() === "",
      thumbnail: false,
      screenshot: false,
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
      await addCustomComponent(formValues);
      navigate("/", { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Unable to save component right now.");
    }
  };

  if (canAddComponent === null) {
    return null;
  }

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

            <label htmlFor="component-display-image">Display Image File</label>
            <input
              id="component-display-image"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={errors.thumbnail ? "error" : ""}
            />
            {fileNames.thumbnail ? <span>{fileNames.thumbnail}</span> : null}
            {errors.thumbnail ? (
              <span className="field-error">Please select a valid image file.</span>
            ) : null}

            <label htmlFor="component-preview-image">Code Preview Image File</label>
            <input
              id="component-preview-image"
              name="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={errors.screenshot ? "error" : ""}
            />
            {fileNames.screenshot ? <span>{fileNames.screenshot}</span> : null}
            {errors.screenshot ? (
              <span className="field-error">Please select a valid image file.</span>
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
            {submitError ? <span className="field-error">{submitError}</span> : null}
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddComponentPage;
