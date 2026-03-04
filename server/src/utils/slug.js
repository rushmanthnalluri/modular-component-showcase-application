export function createSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createComponentId(name) {
  const base = createSlug(name) || "custom-component";
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
