import { getAllComponents } from "@/services/componentsStore";

export async function fetchComponents() {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return await getAllComponents();
}

export async function fetchComponentById(id) {
  const items = await fetchComponents();
  return items.find((component) => component.id === id) || null;
}