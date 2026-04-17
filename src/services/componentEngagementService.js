import { apiRequest } from "@/services/apiClient";
import { resolveBackendComponentId } from "@/services/componentLookupService";

const LOCAL_RATING_KEY = "localComponentRatings";
const LOCAL_REVIEW_KEY = "localComponentReviews";
const LOCAL_DISCUSSION_KEY = "localComponentDiscussions";

function readLocalRatingsMap() {
  try {
    const raw = localStorage.getItem(LOCAL_RATING_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalRatingsMap(map) {
  localStorage.setItem(LOCAL_RATING_KEY, JSON.stringify(map));
}

function readLocalMap(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalMap(storageKey, map) {
  localStorage.setItem(storageKey, JSON.stringify(map));
}

function getLocalItems(storageKey, componentId) {
  const map = readLocalMap(storageKey);
  const items = map[String(componentId)];
  return Array.isArray(items) ? items : [];
}

function setLocalItems(storageKey, componentId, items) {
  const map = readLocalMap(storageKey);
  map[String(componentId)] = Array.isArray(items) ? items : [];
  writeLocalMap(storageKey, map);
}

function getLocalAuthDisplayName() {
  try {
    const raw = localStorage.getItem("authUser");
    const parsed = raw ? JSON.parse(raw) : null;
    const name = String(parsed?.fullName || "").trim();
    return name || "You";
  } catch {
    return "You";
  }
}

function getLocalRating(componentId) {
  const map = readLocalRatingsMap();
  const value = Number(map[String(componentId)]);
  return Number.isFinite(value) ? Math.max(1, Math.min(5, value)) : null;
}

function setLocalRating(componentId, rating) {
  const map = readLocalRatingsMap();
  map[String(componentId)] = Number(rating);
  writeLocalRatingsMap(map);
}

function isMissingComponentError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("component not found") || message.includes("status 404");
}

export async function getComponentRatings(componentId) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    const payload = await apiRequest(`/components/${encodeURIComponent(backendId || componentId)}/ratings`, {
      method: "GET",
    });

    return {
      average: Number(payload?.average || 0),
      total: Number(payload?.total || 0),
      ratings: Array.isArray(payload?.ratings) ? payload.ratings : [],
    };
  } catch (error) {
    if (isMissingComponentError(error)) {
      const localRating = getLocalRating(componentId);
      if (localRating === null) {
        return { average: 0, total: 0, ratings: [] };
      }

      return {
        average: localRating,
        total: 1,
        ratings: [{ userId: "local", rating: localRating }],
      };
    }
    throw error;
  }
}

export async function submitComponentRating(componentId, rating) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    const payload = await apiRequest(`/components/${encodeURIComponent(backendId || componentId)}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating: Number(rating) }),
    });

    return {
      rating: Number(payload?.rating || 0),
      totalRatings: Number(payload?.totalRatings || 0),
    };
  } catch (error) {
    if (isMissingComponentError(error)) {
      const safeRating = Math.max(1, Math.min(5, Number(rating) || 0));
      setLocalRating(componentId, safeRating);
      return {
        rating: safeRating,
        totalRatings: 1,
      };
    }
    throw error;
  }
}

export async function listComponentReviews(componentId, options = {}) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  const params = new URLSearchParams();
  if (options.sort) {
    params.set("sort", String(options.sort));
  }
  if (options.page) {
    params.set("page", String(options.page));
  }
  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  try {
    const payload = await apiRequest(
      `/components/${encodeURIComponent(backendId || componentId)}/reviews${queryString}`,
      { method: "GET" }
    );

    return {
      reviews: Array.isArray(payload?.reviews) ? payload.reviews : [],
      pagination: payload?.pagination || null,
    };
  } catch (error) {
    if (isMissingComponentError(error)) {
      const localReviews = getLocalItems(LOCAL_REVIEW_KEY, componentId);
      const page = Number(options.page || 1);
      const limit = Number(options.limit || 10);
      const start = Math.max(0, (page - 1) * limit);
      const end = start + Math.max(1, limit);
      const sliced = localReviews.slice(start, end);
      return {
        reviews: sliced,
        pagination: {
          total: localReviews.length,
          page,
          limit,
          pages: Math.ceil(localReviews.length / limit),
        },
      };
    }
    throw error;
  }
}

export async function createComponentReview(componentId, payload) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    return await apiRequest(`/components/${encodeURIComponent(backendId || componentId)}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isMissingComponentError(error)) {
      const now = new Date().toISOString();
      const review = {
        _id: `local-review-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        componentId,
        rating: Number(payload?.rating || 0),
        title: String(payload?.title || "").trim(),
        comment: String(payload?.comment || "").trim(),
        helpful: 0,
        unhelpful: 0,
        status: "approved",
        createdAt: now,
        updatedAt: now,
        userId: {
          fullName: getLocalAuthDisplayName(),
          avatarUrl: "",
        },
      };

      const existing = getLocalItems(LOCAL_REVIEW_KEY, componentId);
      setLocalItems(LOCAL_REVIEW_KEY, componentId, [review, ...existing]);
      return review;
    }
    throw error;
  }
}

export async function markReviewHelpful(componentId, reviewId, helpful) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    return await apiRequest(
      `/components/${encodeURIComponent(backendId || componentId)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: "POST",
        body: JSON.stringify({ helpful: Boolean(helpful) }),
      }
    );
  } catch (error) {
    if (isMissingComponentError(error)) {
      const existing = getLocalItems(LOCAL_REVIEW_KEY, componentId);
      const updated = existing.map((review) => {
        const id = String(review?._id || review?.id || "");
        if (id !== String(reviewId)) {
          return review;
        }

        return {
          ...review,
          helpful: Boolean(helpful)
            ? Number(review.helpful || 0) + 1
            : Number(review.helpful || 0),
          unhelpful: Boolean(helpful)
            ? Number(review.unhelpful || 0)
            : Number(review.unhelpful || 0) + 1,
        };
      });

      setLocalItems(LOCAL_REVIEW_KEY, componentId, updated);
      return { ok: true };
    }
    throw error;
  }
}

export async function listComponentDiscussions(componentId) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    const payload = await apiRequest(`/components/${encodeURIComponent(backendId || componentId)}/discussions`, {
      method: "GET",
    });

    return Array.isArray(payload?.discussions) ? payload.discussions : [];
  } catch (error) {
    if (isMissingComponentError(error)) {
      return getLocalItems(LOCAL_DISCUSSION_KEY, componentId);
    }
    throw error;
  }
}

export async function createComponentDiscussion(componentId, payload) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    return await apiRequest(`/components/${encodeURIComponent(backendId || componentId)}/discussions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isMissingComponentError(error)) {
      const now = new Date().toISOString();
      const discussion = {
        _id: `local-discussion-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        componentId,
        message: String(payload?.message || "").trim(),
        parentId: payload?.parentId || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
        userId: {
          fullName: getLocalAuthDisplayName(),
          avatarUrl: "",
        },
      };

      const existing = getLocalItems(LOCAL_DISCUSSION_KEY, componentId);
      setLocalItems(LOCAL_DISCUSSION_KEY, componentId, [discussion, ...existing]);
      return discussion;
    }
    throw error;
  }
}

export async function moderateComponentDiscussion(componentId, discussionId, status) {
  const backendId = await resolveBackendComponentId(componentId, { allowRefresh: true });
  try {
    return await apiRequest(
      `/components/${encodeURIComponent(backendId || componentId)}/discussions/${encodeURIComponent(discussionId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  } catch (error) {
    if (isMissingComponentError(error)) {
      const existing = getLocalItems(LOCAL_DISCUSSION_KEY, componentId);
      const updated = existing.map((discussion) => {
        const id = String(discussion?._id || discussion?.id || "");
        if (id !== String(discussionId)) {
          return discussion;
        }

        return {
          ...discussion,
          status: status === "active" ? "active" : "hidden",
        };
      });

      setLocalItems(LOCAL_DISCUSSION_KEY, componentId, updated);
      return { status: status === "active" ? "active" : "hidden" };
    }
    throw error;
  }
}

export async function fetchReviewsFeed(componentId = "") {
  const query = componentId ? `?componentId=${encodeURIComponent(componentId)}` : "";
  const payload = await apiRequest(`/reviews${query}`, { method: "GET" });
  return Array.isArray(payload?.reviews) ? payload.reviews : [];
}

export async function fetchDiscussionsFeed(componentId = "") {
  const query = componentId ? `?componentId=${encodeURIComponent(componentId)}` : "";
  const payload = await apiRequest(`/discussions${query}`, { method: "GET" });
  return Array.isArray(payload?.discussions) ? payload.discussions : [];
}

export async function semanticComponentSearch(query, limit = 10) {
  if (!String(query || "").trim()) {
    return [];
  }

  const payload = await apiRequest("/search", {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  });

  return Array.isArray(payload) ? payload : [];
}
