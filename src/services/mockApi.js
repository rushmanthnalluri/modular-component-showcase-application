import { getAllComponents } from "@/services/componentsStore";

export async function fetchComponents() {
  return getAllComponents();
}

export async function fetchComponentById(id) {
  const items = await fetchComponents();
  return items.find((component) => component.id === id) || null;
}
