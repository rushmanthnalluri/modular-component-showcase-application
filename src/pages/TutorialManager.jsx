import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { createTutorialPost, deleteTutorialPost, updateTutorialPost } from "@/services/contentService";
import "./TutorialManager.css";

const initialForm = {
  slug: "",
  title: "",
  summary: "",
  markdown: "",
  tags: "",
  isPublished: true,
};

export default function TutorialManager() {
  const { authUser, isLoggedIn } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const isAdmin = useMemo(() => String(authUser?.role || "").toLowerCase() === "admin", [authUser]);

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setResult("");
    try {
      await createTutorialPost({
        ...form,
        tags: form.tags.split(",").map((entry) => entry.trim()).filter(Boolean),
      });
      setResult("Tutorial created.");
    } catch (error) {
      setResult(error?.message || "Failed to create tutorial.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate() {
    if (!form.slug.trim()) return;
    setBusy(true);
    setResult("");
    try {
      await updateTutorialPost(form.slug.trim(), {
        title: form.title,
        summary: form.summary,
        markdown: form.markdown,
        tags: form.tags.split(",").map((entry) => entry.trim()).filter(Boolean),
        isPublished: Boolean(form.isPublished),
      });
      setResult("Tutorial updated.");
    } catch (error) {
      setResult(error?.message || "Failed to update tutorial.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!form.slug.trim()) return;
    if (!window.confirm(`Delete tutorial "${form.slug}"?`)) return;
    setBusy(true);
    setResult("");
    try {
      await deleteTutorialPost(form.slug.trim());
      setResult("Tutorial deleted.");
      setForm(initialForm);
    } catch (error) {
      setResult(error?.message || "Failed to delete tutorial.");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="layout-container tutorial-manager-state">
          <h1>Tutorial Manager</h1>
          <p>Login required.</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="layout-container tutorial-manager-state">
          <h1>Tutorial Manager</h1>
          <p>Admin access required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="layout-container tutorial-manager-page">
        <h1>Tutorial Admin Manager</h1>
        <p>Create, edit, and delete markdown tutorials.</p>

        <form className="tutorial-manager-form" onSubmit={handleCreate}>
          <label>
            Slug
            <input
              type="text"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="component-versioning-workflow"
            />
          </label>
          <label>
            Title
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <label>
            Summary
            <input
              type="text"
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
          </label>
          <label>
            Tags (comma-separated)
            <input
              type="text"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            />
          </label>
          <label>
            Markdown
            <textarea
              rows={14}
              value={form.markdown}
              onChange={(event) => setForm((prev) => ({ ...prev, markdown: event.target.value }))}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(form.isPublished)}
              onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
            />
            Published
          </label>

          <div className="actions">
            <button type="submit" disabled={busy}>Create</button>
            <button type="button" disabled={busy} onClick={handleUpdate}>Update by Slug</button>
            <button type="button" className="danger" disabled={busy} onClick={handleDelete}>Delete by Slug</button>
          </div>
        </form>

        {result ? <p className="result">{result}</p> : null}
      </div>
    </Layout>
  );
}
