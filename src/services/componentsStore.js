import { components } from "@/data/components.data";
import { apiRequest } from "@/services/apiClient";

function mapCloudComponent(rawItem) {
  return {
    id: String(rawItem.id || ""),
    name: String(rawItem.name || "Untitled Component"),
    description: String(rawItem.description || ""),
    category: String(rawItem.category || "all"),
    tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
    thumbnail: String(rawItem.thumbnail || ""),
    screenshot: String(rawItem.screenshot || ""),
    code: {
      jsx: String(rawItem.code?.jsx || ""),
      css: String(rawItem.code?.css || ""),
    },
  };
}

async function getCloudComponents() {
  const payload = await apiRequest("/components", {
    method: "GET",
  });

  return payload
    .map((item) => mapCloudComponent(item))
    .filter((item) => item.id);
}

export async function getAllComponents() {
  const customComponents = await getCloudComponents();
  return [...components, ...customComponents];
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