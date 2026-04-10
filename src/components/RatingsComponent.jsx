import { useState, useEffect } from "react";
import { submitRating, getRatings } from "@/services/ratingsService";
import "./RatingsComponent.css";

export default function RatingsComponent({ componentId, onRatingSubmitted }) {
  const [ratings, setRatings] = useState({ average: 0, total: 0, ratings: [] });
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [componentId]);

  async function fetchRatings() {
    try {
      const data = await getRatings(componentId);
      setRatings(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      setError("Failed to load ratings");
    }
  }

  async function handleRateClick(rating) {
    if (loading) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const result = await submitRating(componentId, rating);
      setUserRating(rating);
      setRatings(result);
      setSuccess(true);
      setHoveredRating(0);

      setTimeout(() => setSuccess(false), 3000);

      if (onRatingSubmitted) {
        onRatingSubmitted(result);
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const currentRating = hoveredRating || userRating;

  return (
    <div className="ratings-container">
      <div className="ratings-header">
        <h3>Rate this component</h3>
        {ratings.total > 0 && (
          <div className="ratings-stat">
            <span className="average-rating">{ratings.average.toFixed(1)}</span>
            <span className="total-ratings">({ratings.total} ratings)</span>
          </div>
        )}
      </div>

      <div className="stars-container">
        {stars.map((star) => (
          <button
            key={star}
            className={`star ${currentRating >= star ? "active" : ""} ${loading ? "disabled" : ""}`}
            onClick={() => handleRateClick(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={loading}
            title={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>

      {currentRating > 0 && (
        <p className="rating-label">
          {currentRating === 1 && "Poor"}
          {currentRating === 2 && "Fair"}
          {currentRating === 3 && "Good"}
          {currentRating === 4 && "Very Good"}
          {currentRating === 5 && "Excellent"}
        </p>
      )}

      {success && (
        <div className="success-message">✓ Rating submitted successfully!</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {ratings.total > 0 && (
        <div className="ratings-breakdown">
          <h4>Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.ratings?.filter(r => r.rating === star).length || 0;
            const percentage = ratings.total > 0 ? (count / ratings.total) * 100 : 0;
            return (
              <div key={star} className="breakdown-row">
                <span className="star-label">{star}★</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="count">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
