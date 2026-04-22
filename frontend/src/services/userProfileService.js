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
  avatarImage,
  avatarUrl,
  avatarFile,
  socialLinks,
  emailPreferences,
}) {
  let payload;

  if (avatarFile) {
    const formData = new FormData();
    formData.append("fullName", String(fullName || ""));
    formData.append("email", String(email || ""));
    formData.append("phone", String(phone || ""));
    formData.append("bio", String(bio || ""));
    formData.append("avatar", avatarFile);
    formData.append("socialLinks", JSON.stringify(socialLinks || {}));
    formData.append("emailPreferences", JSON.stringify(emailPreferences || {}));

    if (avatarUrl !== undefined) {
      formData.append("avatarUrl", String(avatarUrl || ""));
    }

    payload = await apiRequest("/users/me", {
      method: "PUT",
      body: formData,
    });
  } else {
    payload = await apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify({
        fullName,
        email,
        phone,
        bio,
        avatarImage,
        avatarUrl,
        socialLinks,
        emailPreferences,
      }),
    });
  }

  if (payload?.user) {
    updateStoredAuthUser(payload.user);
  }

  return payload?.user || null;
}
