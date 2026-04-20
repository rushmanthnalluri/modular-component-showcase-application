import { apiRequest } from "@/services/apiClient";
import { updateStoredAuthUser } from "@/services/authAccess";

export async function getCurrentUserProfile() {
  const payload = await apiRequest("/users/me", { method: "GET" });
  return payload?.user || null;
}

export async function updateCurrentUserProfile({
  fullName,
  email,
  phone,
  bio,
  avatarUrl,
  socialLinks,
  emailPreferences,
}) {
  const payload = await apiRequest("/users/me", {
    method: "PUT",
    body: JSON.stringify({
      fullName,
      email,
      phone,
      bio,
      avatarUrl,
      socialLinks,
      emailPreferences,
    }),
  });

  if (payload?.user) {
    updateStoredAuthUser(payload.user);
  }

  return payload?.user || null;
}
