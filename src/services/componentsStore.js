import { components } from "@/data/components.data";

const STORAGE_KEY = "customComponents";

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getStoredCustomComponents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredCustomComponents(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createUniqueId(name, existingItems) {
  const base = createSlug(name) || "custom-component";
  let candidate = base;
  let suffix = 1;

  while (existingItems.some((item) => item.id === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export function getAllComponents() {
  const customComponents = getStoredCustomComponents();
  return [...components, ...customComponents];
}

export function addCustomComponent({
  name,
  description,
  jsxCode,
  cssCode,
  category,
  thumbnail = "",
  screenshot = "",
}) {
  const allComponents = getAllComponents();
  const id = createUniqueId(name, allComponents);
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedThumbnail = thumbnail.trim();
  const trimmedScreenshot = screenshot.trim();

  const newComponent = {
    id,
    name: trimmedName,
    description: trimmedDescription,
    category,
    tags: [category, "user-added", ...trimmedName.toLowerCase().split(/\s+/)].slice(0, 5),
    thumbnail: trimmedThumbnail,
    screenshot: trimmedScreenshot,
    code: {
      jsx: jsxCode.trim(),
      css: cssCode.trim(),
    },
  };

  const updatedCustomComponents = [...getStoredCustomComponents(), newComponent];
  setStoredCustomComponents(updatedCustomComponents);

  return newComponent;
}