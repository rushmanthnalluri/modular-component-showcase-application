import { Link } from "react-router-dom";
import "./ComponentCard.css";

const ComponentCard = ({
  id,
  name,
  description,
  category,
  thumbnail,
}) => {
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
        <div className="component-card-head">
          <h3>{name}</h3>
          <span className="component-tag">{category}</span>
        </div>
        <p>{description}</p>
        <Link to={`/component/${id}`} className="component-link">
          View Component
        </Link>
      </div>
    </div>
  );
};

export default ComponentCard;
