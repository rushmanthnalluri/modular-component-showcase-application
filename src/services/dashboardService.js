import { apiRequest } from "@/services/apiClient";

export async function getUserProfile() {
  try {
    const data = await apiRequest("/users/me", { method: "GET" });
    return data.user;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

export async function updateUserProfile(profile) {
  try {
    const data = await apiRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    return data.user;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function getUserDashboard() {
  try {
    const data = await apiRequest("/users/me/dashboard", { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    throw error;
  }
}

export async function getUserComponents(page = 1, limit = 10) {
  try {
    const data = await apiRequest(`/users/me/components?page=${page}&limit=${limit}`, {
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Error fetching user components:", error);
    return { components: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
  }
}

export async function getSubmissionHistory(page = 1, limit = 20) {
  try {
    const data = await apiRequest(`/users/me/submission-history?page=${page}&limit=${limit}`, {
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Error fetching submission history:", error);
    return { history: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
  }
}

export async function getUserFavorites() {
  try {
    const data = await apiRequest("/users/me/favorites", { method: "GET" });
    return data.favorites || [];
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

export async function toggleUserFavorite(componentId) {
  try {
    const data = await apiRequest(`/users/me/favorites/${componentId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return data.favorites || [];
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
}

export async function getFavoriteComponents() {
  try {
    const data = await apiRequest("/users/me/favorites/components", {
      method: "GET",
    });
    return data.components || [];
  } catch (error) {
    console.error("Error fetching favorite components:", error);
    return [];
  }
}
