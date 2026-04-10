import { useState, useEffect, useCallback } from "react";
import { getReviews, submitReview, markReviewHelpful } from "@/services/ratingsService";
import "./ReviewsComponent.css";

export default function ReviewsComponent({ componentId, userIsAuthenticated }) {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [sortBy, setSortBy] = useState("helpful");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 0, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getReviews(componentId, { sort: sortBy, page, limit: 10 });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [componentId, sortBy]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleSubmitReview(e) {
    e.preventDefault();

    if (!formData.rating || !formData.comment.trim()) {
      setError("Please provide a rating and comment");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const newReview = await submitReview(componentId, {
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
      });

      setReviews([newReview, ...reviews]);
      setFormData({ rating: 0, title: "", comment: "" });
      setShowForm(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkHelpful(reviewId, helpful) {
    try {
      const result = await markReviewHelpful(componentId, reviewId, helpful);
      setReviews(
        reviews.map((r) =>
          r._id === reviewId
            ? { ...r, helpful: result.helpful, unhelpful: result.unhelpful }
            : r
        )
      );
    } catch (err) {
      console.error("Error marking review:", err);
    }
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchReviews(page);
    }
  };

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <div>
          <h3>Reviews & Comments ({pagination.total})</h3>
        </div>
        {userIsAuthenticated && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Write Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="review-form">
          <h4>Share Your Experience</h4>
          {success && (
            <div className="success-message">✓ Review submitted successfully!</div>
          )}
          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-selector">
                {stars.map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${formData.rating >= star ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title (optional)</label>
              <input
                id="title"
                type="text"
                placeholder="Summarize your experience..."
                maxLength="200"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="comment">Comment *</label>
              <textarea
                id="comment"
                placeholder="Share your thoughts about this component..."
                rows="4"
                maxLength="5000"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                required
              />
              <small>
                {formData.comment.length}/5000 characters
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ rating: 0, title: "", comment: "" });
                }}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="reviews-sort">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          disabled={loading}
        >
          <option value="helpful">Most Helpful</option>
          <option value="recent">Most Recent</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {loading && <div className="loading">Loading reviews...</div>}

      {error && !showForm && (
        <div className="error-message">{error}</div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to share your thoughts!</p>
        </div>
      )}

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <strong>{review.userId?.fullName || "Anonymous"}</strong>
                {review.isVerified && <span className="verified-badge">✓ Verified</span>}
              </div>
              <div className="review-rating">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star ${i < review.rating ? "filled" : ""}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {review.title && <h5 className="review-title">{review.title}</h5>}

            <p className="review-comment">{review.comment}</p>

            <div className="review-meta">
              <small>
                {new Date(review.createdAt).toLocaleDateString()}
              </small>

              <div className="review-helpful">
                <button
                  className="helpful-btn"
                  onClick={() => handleMarkHelpful(review._id, true)}
                  title="Mark as helpful"
                >
                  👍 {review.helpful || 0}
                </button>
                <button
                  className="helpful-btn"
                  onClick={() => handleMarkHelpful(review._id, false)}
                  title="Mark as unhelpful"
                >
                  👎 {review.unhelpful || 0}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ← Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
