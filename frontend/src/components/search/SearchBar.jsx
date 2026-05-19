import { Search } from "lucide-react";
import "@/styles/showcase-components.css";

// Props contract: parent provides value + onChange; SearchBar stays declarative and reusable.
function SearchBar({
  value = "",
  onChange,
  placeholder = "Search components, UI ideas, or describe functionality...",
  label = "Search components",
  inputId = "component-search",
}) {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="search-bar">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search className="search-bar-icon" aria-hidden="true" />
      <input
        id={inputId}
        type="text"
        placeholder={placeholder}
        aria-label={label}
        value={value}
        onChange={handleChange}
        className="search-bar-input"
      />
    </div>
  );
}

export default SearchBar;
