import { categories } from "@/data/components.data";
import "./ShowcaseComponents.css";

// Props are a configuration contract: parent controls activeCategory and callback.
const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  return (
    <div className="category-filter">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            type="button"
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={isActive ? "filter-btn active" : "filter-btn"}
            aria-label={`Filter components by ${category.name}`}
          >
            <Icon />
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
