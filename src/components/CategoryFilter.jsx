import { categories } from "@/data/components.data";
import "./ShowcaseComponents.css";

// Props are a configuration contract: parent controls activeCategory and callback.
const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  const handleKeyDown = (event, categoryId) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = categories.findIndex((category) => category.id === categoryId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % categories.length
        : (currentIndex - 1 + categories.length) % categories.length;
    onCategoryChange(categories[nextIndex].id);
  };

  return (
    <div className="category-filter" role="radiogroup" aria-label="Component categories">
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
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, category.id)}
          >
            <Icon aria-hidden="true" />
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
