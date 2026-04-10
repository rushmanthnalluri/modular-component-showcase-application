import { apiRequest } from "@/services/apiClient";

export async function fetchDiscussions(componentId) {
  try {
    const payload = await apiRequest(`/components/${componentId}/discussions`, { method: "GET" });
    return Array.isArray(payload?.discussions) ? payload.discussions : [];
  } catch {
    return [];
  }
}

export async function createDiscussion(componentId, message, parentId = null) {
  const payload = await apiRequest(`/components/${componentId}/discussions`, {
    method: "POST",
    body: JSON.stringify({ message, parentId }),
  });

  return payload;
}

export async function updateDiscussionStatus(componentId, discussionId, status) {
  const payload = await apiRequest(`/components/${componentId}/discussions/${discussionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return payload;
}
