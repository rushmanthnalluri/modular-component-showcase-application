import { apiRequest } from "@/services/apiClient";

export async function trackComponentView(componentId) {
  try {
    await apiRequest(`/components/${componentId}`, { method: "GET" });
  } catch (error) {
    console.error("Error tracking view:", error);
  }
}

export async function getMostViewedComponents(limit = 10, timeframe = "all") {
  try {
    const data = await apiRequest(`/components/stats/most-viewed?limit=${limit}&timeframe=${timeframe}`, {
      method: "GET",
    });
    return data || [];
  } catch (error) {
    console.error("Error fetching most viewed:", error);
    return [];
  }
}

export async function getTopRatedComponents(limit = 10, minReviews = 1) {
  try {
    const data = await apiRequest(`/components/stats/top-rated?limit=${limit}&minReviews=${minReviews}`, {
      method: "GET",
    });
    return data || [];
  } catch (error) {
    console.error("Error fetching top-rated:", error);
    return [];
  }
}

export async function getMostViewedByTimeframe(timeframe = "week", limit = 10) {
  return getMostViewedComponents(limit, timeframe);
}

export async function getRateLimitAnalytics() {
  try {
    const data = await apiRequest("/admin/rate-limits", { method: "GET" });
    return data;
  } catch {
    return null;
  }
}

export async function searchComponents(query, { category, tags, sortBy, minRating, page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams({
      ...(query && { search: query }),
      ...(category && { category }),
      ...(tags && { tags: Array.isArray(tags) ? tags.join(",") : tags }),
      ...(sortBy && { sortBy }),
      ...(minRating && { minRating }),
      page,
      limit,
    });

    const data = await apiRequest(`/components?${params.toString()}`, { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error searching components:", error);
    return { items: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
  }
}

export async function filterComponents(filters) {
  return searchComponents("", filters);
}
