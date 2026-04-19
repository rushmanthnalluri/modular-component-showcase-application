import { apiRequest } from "@/services/apiClient";

const fallbackPosts = [
  {
    slug: "designing-reusable-react-components",
    title: "Designing Reusable React Components",
    summary: "A practical checklist for building flexible UI components.",
    tags: ["react", "components", "architecture"],
    markdown: "# Designing Reusable React Components\n\n## Core Principles\n\n- Keep APIs small and explicit\n- Prefer composition over inheritance\n- Document props with examples\n\n## Common Pitfalls\n\n- Coupling layout + data fetching\n- Hidden side effects\n- Missing accessibility semantics\n",
    createdAt: new Date().toISOString(),
  },
  {
    slug: "component-versioning-workflow",
    title: "Component Versioning Workflow",
    summary: "How to release component updates safely with changelogs.",
    tags: ["versioning", "changelog"],
    markdown: "# Component Versioning Workflow\n\n## Suggested Convention\n\n- Patch: bug fixes\n- Minor: backward-compatible features\n- Major: breaking changes\n\n## Release Checklist\n\n- Update changelog\n- Add migration notes\n- Verify examples still render\n",
    createdAt: new Date().toISOString(),
  },
];

export async function getTutorialPosts() {
  try {
    const payload = await apiRequest("/content/tutorials", { method: "GET" });
    if (Array.isArray(payload?.posts) && payload.posts.length > 0) {
      return payload.posts;
    }
    return fallbackPosts;
  } catch {
    return fallbackPosts;
  }
}

export async function getTutorialPost(slug) {
  try {
    const payload = await apiRequest(`/content/tutorials/${encodeURIComponent(slug)}`, { method: "GET" });
    if (payload?.post) {
      return payload.post;
    }
  } catch {
    // ignored: fallback below
  }

  return fallbackPosts.find((post) => post.slug === slug) || null;
}

export async function createTutorialPost(payload) {
  const data = await apiRequest("/content/tutorials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.post || null;
}

export async function updateTutorialPost(slug, payload) {
  const data = await apiRequest(`/content/tutorials/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data?.post || null;
}

export async function deleteTutorialPost(slug) {
  return apiRequest(`/content/tutorials/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });
}
