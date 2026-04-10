import { apiRequest } from "@/services/apiClient";

export async function submitRating(componentId, rating) {
  try {
    const data = await apiRequest(`/components/${componentId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
    return data;
  } catch (error) {
    console.error("Error submitting rating:", error);
    throw error;
  }
}

export async function getRatings(componentId) {
  try {
    const data = await apiRequest(`/components/${componentId}/ratings`, {
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return { average: 0, total: 0, ratings: [] };
  }
}

export async function submitReview(componentId, { rating, title, comment }) {
  try {
    const data = await apiRequest(`/components/${componentId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, title, comment }),
    });
    return data;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}

export async function getReviews(componentId, { sort = "helpful", page = 1, limit = 10 } = {}) {
  try {
    const data = await apiRequest(
      `/components/${componentId}/reviews?sort=${sort}&page=${page}&limit=${limit}`,
      { method: "GET" }
    );
    return data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { reviews: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
  }
}

export async function markReviewHelpful(componentId, reviewId, helpful) {
  try {
    const data = await apiRequest(
      `/components/${componentId}/reviews/${reviewId}/helpful`,
      {
        method: "POST",
        body: JSON.stringify({ helpful }),
      }
    );
    return data;
  } catch (error) {
    console.error("Error marking review:", error);
    throw error;
  }
}
