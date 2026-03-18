import { Search } from "lucide-react";
import "./ShowcaseComponents.css";

// Props contract: parent provides value + onChange; SearchBar stays declarative and reusable.
function SearchBar({ value = "", onChange }) {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="search-bar">
      <label htmlFor="component-search" className="sr-only">
        Search components
      </label>
      <Search className="search-bar-icon" />
      <input
        id="component-search"
        type="text"
        placeholder="Search components..."
        aria-label="Search components"
        value={value}
        onChange={handleChange}
        className="search-bar-input"
      />
    </div>
  );
}

export default SearchBar;
