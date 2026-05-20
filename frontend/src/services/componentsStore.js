import { components } from "@/data/components.data";
import { apiRequest } from "@/services/apiClient";
import {
  preloadComponentLookup,
  registerBackendComponents,
  resolveBackendComponentId,
} from "@/services/componentLookupService";

let lastCloudSyncError = null;
const VERIFIER_NAME_PREFIX = "Verifier Component";
const VERIFIER_DESCRIPTION_MARKER = "Created by verify-connection script";

function mergeWithLocalFallback(localItem, cloudItem) {
  if (!localItem) {
    return cloudItem;
  }

  return {
    ...localItem,
    ...cloudItem,
    id: cloudItem.id,
    thumbnail: cloudItem.thumbnail || localItem.thumbnail || "",
    screenshot: cloudItem.screenshot || localItem.screenshot || "",
  };
}

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
          avatarImage: String(rawAuthor.avatarImage || rawAuthor.avatarUrl || ""),
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
    difficulty: String(rawItem.difficulty || ""),
    useCase: String(rawItem.useCase || ""),
    accessibilityNotes: String(rawItem.accessibilityNotes || ""),
    responsiveNotes: String(rawItem.responsiveNotes || ""),
    demoAvailable: Boolean(rawItem.demoAvailable),
    previewMetadata:
      rawItem.previewMetadata && typeof rawItem.previewMetadata === "object"
        ? rawItem.previewMetadata
        : {},
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

function normalizeTagsInput(value) {
  const rawTags = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",");

  return Array.from(
    new Set(rawTags.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean))
  );
}

async function getCloudComponents() {
  const payload = await apiRequest("/components", {
    method: "GET",
  });

  const collection = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(collection)) {
    return [];
  }

  const mapped = collection
    .map((item) => mapCloudComponent(item))
    .filter((item) => item.id && !isVerifierArtifact(item));

  registerBackendComponents(mapped);
  return mapped;
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
    await preloadComponentLookup();
    lastCloudSyncError = null;

    if (customComponents.length > 0) {
      const localMap = new Map(components.map((item) => [item.id, item]));
      const cloudIds = new Set(customComponents.map((item) => item.id));

      const cloudFirst = customComponents.map((cloudItem) => mergeWithLocalFallback(localMap.get(cloudItem.id), cloudItem));

      const localFallbackOnly = components.filter((item) => !cloudIds.has(item.id));
      return [...cloudFirst, ...localFallbackOnly];
    }

    return [...components];
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
  const normalizedTags = normalizeTagsInput(tags).slice(0, 12);

  const payload = await apiRequest("/components", {
    method: "POST",
    body: JSON.stringify({
      name: trimmedName,
      description: trimmedDescription,
      descriptionMarkdown: trimmedDescriptionMarkdown,
      category: trimmedCategory,
      tags: normalizedTags,
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
  const backendId = await resolveBackendComponentId(id, {
    localName: local?.name,
    allowRefresh: true,
  });

  try {
    const payload = await apiRequest(`/components/${backendId || id}`, {
      method: "GET",
    });
    const mapped = mapCloudComponent(payload);

    if (!local) {
      return mapped;
    }

    return {
      ...mapped,
      ...local,
      id: local.id,
      averageRating: mapped.averageRating,
      totalReviews: mapped.totalReviews,
      viewCount: mapped.viewCount,
      createdAt: mapped.createdAt,
      updatedAt: mapped.updatedAt,
    };
  } catch {
    if (local) {
      return local;
    }
    return null;
  }
}

export { getShowcaseDemo } from "@/demos/showcaseRegistry";

export async function deleteComponent(id) {
  await apiRequest(`/components/${id}`, {
    method: "DELETE",
  });
}

export async function updateComponent(id, updates) {
  const payload = await apiRequest(`/components/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return mapCloudComponent(payload?.data || payload);
}

export async function getMyComponents({ page = 1, limit = 20 } = {}) {
  const payload = await apiRequest(`/dashboard?page=${page}&limit=${limit}`, {
    method: "GET",
  });

  const collection = Array.isArray(payload?.components) ? payload.components : [];
  return {
    components: collection.map((item) => mapCloudComponent(item)),
    pagination: payload?.pagination || null,
  };
}
