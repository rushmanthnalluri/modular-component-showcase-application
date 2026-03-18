import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ShowcaseComponents.css";

const ComponentCard = ({
  id,
  name,
  description,
  thumbnail,
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
        <h3>{name}</h3>
        <p>{description}</p>
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

