import { categories } from "@/features/showcase/data/components";
import "./CategoryFilter.css";

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
