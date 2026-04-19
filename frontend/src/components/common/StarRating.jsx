import { Star } from "lucide-react";

const StarRating = ({ rating = 0, max = 5, showValue = true, className = "" }) => {
  const normalizedRating = Math.max(0, Math.min(Number(rating) || 0, max));
  const roundedRating = Math.round(normalizedRating);
  const stars = Array.from({ length: max }, (_, index) => index < roundedRating);

  return (
    <div
      className={`star-rating ${className}`.trim()}
      aria-label={`${normalizedRating.toFixed(1)} out of ${max} stars`}
    >
      <span className="star-rating-icons" aria-hidden="true">
        {stars.map((isFilled, index) => (
          <Star
            key={`${index}-${isFilled ? "filled" : "empty"}`}
            size={14}
            fill={isFilled ? "currentColor" : "none"}
          />
        ))}
      </span>
      {showValue ? <span className="star-rating-value">{normalizedRating.toFixed(1)}</span> : null}
    </div>
  );
};

export default StarRating;