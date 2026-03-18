import { components } from "@/data/components.data";
import { apiRequest } from "@/services/apiClient";

let lastCloudSyncError = null;
const VERIFIER_NAME_PREFIX = "Verifier Component";
const VERIFIER_DESCRIPTION_MARKER = "Created by verify-connection script";

function mapCloudComponent(rawItem) {
  return {
    id: String(rawItem.id || ""),
    name: String(rawItem.name || "Untitled Component"),
    description: String(rawItem.description || ""),
    category: String(rawItem.category || "all"),
    tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
    thumbnail: String(rawItem.thumbnail || ""),
    screenshot: String(rawItem.screenshot || ""),
    createdBy: String(rawItem.createdBy || ""),
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

  return payload
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
  jsxCode,
  cssCode,
  category,
  thumbnail = "",
  screenshot = "",
}) {
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedThumbnail = thumbnail.trim();
  const trimmedScreenshot = screenshot.trim();
  const trimmedCategory = category.trim();

  const payload = await apiRequest("/components", {
    method: "POST",
    body: JSON.stringify({
      name: trimmedName,
      description: trimmedDescription,
      category: trimmedCategory,
      jsxCode: jsxCode.trim(),
      cssCode: cssCode.trim(),
      thumbnail: trimmedThumbnail,
      screenshot: trimmedScreenshot,
    }),
  });

  return mapCloudComponent(payload);
}

export async function deleteComponent(id) {
  await apiRequest(`/components/${id}`, {
    method: "DELETE",
  });
}
