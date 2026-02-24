import { Link } from "react-router-dom";
import "./ShowcaseComponents.css";

const ComponentCard = ({
  id,
  name,
  description,
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
        <h3>{name}</h3>
        <p>{description}</p>
        <Link to={`/component/${id}`} className="component-link">
          View Component
        </Link>
      </div>
    </div>
  );
};

export default ComponentCard;
