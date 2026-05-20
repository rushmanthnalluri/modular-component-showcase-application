import { apiRequest } from "@/services/apiClient";

export async function getSqlUsers() {
  const payload = await apiRequest("/admin/sql/users", { method: "GET" });
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function getSqlCategories() {
  const payload = await apiRequest("/admin/sql/categories", { method: "GET" });
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function getSqlComponents() {
  const payload = await apiRequest("/admin/sql/components", { method: "GET" });
  return Array.isArray(payload?.items) ? payload.items : [];
}
