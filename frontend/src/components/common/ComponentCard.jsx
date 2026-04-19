import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import "@/styles/showcase-components.css";

const ComponentCard = ({
  id,
  name,
  description,
  thumbnail,
  tags = [],
  isFavorite = false,
  onToggleFavorite,
  averageRating = 0,
  totalReviews = 0,
  canDelete,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="component-card">
      <div className="component-card-img-wrap">
        {thumbnail ? (
          <img src={thumbnail} alt={`${name} preview`} loading="lazy" />
        ) : (
          <div className="component-card-fallback">{name.charAt(0)}</div>
        )}
      </div>

      <div className="component-card-body">
        <div className="component-card-title-row">
          <h3>{name}</h3>
          {typeof onToggleFavorite === "function" ? (
            <button
              type="button"
              className="component-favorite-btn"
              onClick={() => onToggleFavorite(id)}
              aria-label={isFavorite ? `Unfavorite ${name}` : `Favorite ${name}`}
              title={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          ) : null}
        </div>
        <p>{description}</p>
        {Array.isArray(tags) && tags.length ? (
          <div className="component-card-tags" aria-label="Component tags">
            {tags.slice(0, 6).map((tag) => (
              <span key={tag} className="component-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="component-card-metrics" aria-label="Component rating summary">
          <span>Rating: {Number(averageRating || 0).toFixed(1)} / 5</span>
          <span>Reviews: {Number(totalReviews || 0)}</span>
        </div>
        <div className="component-card-actions">
          <Link to={`/component/${id}`} className="component-link">
            View Component
          </Link>
          {canDelete && (
            <button
              type="button"
              className="component-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label={`Delete ${name}`}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ComponentCard);

