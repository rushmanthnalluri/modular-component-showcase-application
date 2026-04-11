import { components } from "@/data/components.data";
import { apiRequest } from "@/services/apiClient";

let lastCloudSyncError = null;
const VERIFIER_NAME_PREFIX = "Verifier Component";
const VERIFIER_DESCRIPTION_MARKER = "Created by verify-connection script";

function mapCloudComponent(rawItem) {
  const rawAuthor =
    rawItem?.createdBy && typeof rawItem.createdBy === "object" ? rawItem.createdBy : null;

  return {
    id: String(rawItem.id || ""),
    name: String(rawItem.name || "Untitled Component"),
    description: String(rawItem.description || ""),
    descriptionMarkdown: String(rawItem.descriptionMarkdown || ""),
    category: String(rawItem.category || "all"),
    tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
    thumbnail: String(rawItem.thumbnail || ""),
    screenshot: String(rawItem.screenshot || ""),
    createdBy: String(rawAuthor?._id || rawItem.createdBy || ""),
    author: rawAuthor
      ? {
          id: String(rawAuthor._id || ""),
          fullName: String(rawAuthor.fullName || ""),
          email: String(rawAuthor.email || ""),
          avatarUrl: String(rawAuthor.avatarUrl || ""),
        }
      : null,
    version: String(rawItem.version || "1.0.0"),
    versions: Array.isArray(rawItem.versions) ? rawItem.versions : [],
    averageRating: Number(rawItem.averageRating || 0),
    totalReviews: Number(rawItem.totalReviews || 0),
    viewCount: Number(rawItem.viewCount || 0),
    props: Array.isArray(rawItem.props) ? rawItem.props : [],
    usageExamples: Array.isArray(rawItem.usageExamples) ? rawItem.usageExamples : [],
    bestPractices: Array.isArray(rawItem.bestPractices) ? rawItem.bestPractices : [],
    commonPitfalls: Array.isArray(rawItem.commonPitfalls) ? rawItem.commonPitfalls : [],
    dependencies: Array.isArray(rawItem.dependencies) ? rawItem.dependencies : [],
    relatedComponents: Array.isArray(rawItem.relatedComponents) ? rawItem.relatedComponents : [],
    importStatements:
      rawItem.importStatements && typeof rawItem.importStatements === "object"
        ? rawItem.importStatements
        : {},
    performanceMetrics: rawItem.performanceMetrics || {},
    accessibilityScore: Number(rawItem.accessibilityScore || 0),
    accessibilityReport: String(rawItem.accessibilityReport || ""),
    createdAt: String(rawItem.createdAt || ""),
    updatedAt: String(rawItem.updatedAt || ""),
    code: {
      jsx: String(rawItem.code?.jsx || ""),
      css: String(rawItem.code?.css || ""),
    },
  };
}

function isVerifierArtifact(item) {
  const name = String(item?.name || "");
  const description = String(item?.description || "");
  return name.startsWith(VERIFIER_NAME_PREFIX) || description.includes(VERIFIER_DESCRIPTION_MARKER);
}

async function getCloudComponents() {
  const payload = await apiRequest("/components", {
    method: "GET",
  });

  const collection = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(collection)) {
    return [];
  }

  return collection
    .map((item) => mapCloudComponent(item))
    .filter((item) => item.id && !isVerifierArtifact(item));
}

export function getCloudComponentsStatus() {
  if (!lastCloudSyncError) {
    return {
      degraded: false,
      message: "",
    };
  }

  return {
    degraded: true,
    message: lastCloudSyncError.message || "Cloud components are currently unavailable.",
  };
}

export async function getAllComponents() {
  try {
    const customComponents = await getCloudComponents();
    lastCloudSyncError = null;
    return [...components, ...customComponents];
  } catch (error) {
    lastCloudSyncError =
      error instanceof Error
        ? error
        : new Error("Cloud components are currently unavailable.");
    return [...components];
  }
}

export async function addCustomComponent({
  name,
  description,
  descriptionMarkdown = "",
  tags = "",
  jsxCode,
  cssCode,
  category,
  thumbnail = "",
  screenshot = "",
  props = [],
  usageExamples = [],
  bestPractices = [],
  commonPitfalls = [],
  dependencies = [],
  relatedComponents = [],
  importStatements = {},
}) {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedDescriptionMarkdown = String(descriptionMarkdown || "").trim();
  const trimmedThumbnail = thumbnail.trim();
  const trimmedScreenshot = screenshot.trim();
  const trimmedCategory = category.trim();
  const trimmedTags = String(tags || "").trim();

  const payload = await apiRequest("/components", {
    method: "POST",
    body: JSON.stringify({
      name: trimmedName,
      description: trimmedDescription,
      descriptionMarkdown: trimmedDescriptionMarkdown,
      category: trimmedCategory,
      tags: trimmedTags,
      jsxCode: jsxCode.trim(),
      cssCode: cssCode.trim(),
      thumbnail: trimmedThumbnail,
      screenshot: trimmedScreenshot,
      props,
      usageExamples,
      bestPractices,
      commonPitfalls,
      dependencies,
      relatedComponents,
      importStatements,
    }),
  });

  return mapCloudComponent(payload);
}

export async function fetchComponentById(id) {
  const local = components.find((c) => c.id === id);
  if (local) return local;

  try {
    const payload = await apiRequest(`/components/${id}`, {
      method: "GET",
    });
    return mapCloudComponent(payload);
  } catch {
    return null;
  }
}

export { getShowcaseDemo } from "@/demos/showcaseRegistry";

export async function deleteComponent(id) {
  await apiRequest(`/components/${id}`, {
    method: "DELETE",
  });
}
