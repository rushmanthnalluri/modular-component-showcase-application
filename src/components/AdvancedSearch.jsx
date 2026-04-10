import { useState, useEffect } from "react";
import { searchComponents, getMostViewedComponents, getTopRatedComponents } from "@/services/analyticsService";
import "./AdvancedSearch.css";

export default function AdvancedSearch({ onComponentsFound, onLoadingChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [minRating, setMinRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  const categories = [
    "all",
    "buttons",
    "inputs",
    "cards",
    "modals",
    "navigation",
    "forms",
    "layout",
    "tables",
    "alerts",
  ];

  const commonTags = [
    "responsive",
    "accessible",
    "animated",
    "reusable",
    "lightweight",
    "customizable",
    "user-added",
  ];

  useEffect(() => {
    performSearch();
  }, [selectedCategory, sortBy, minRating, page]);

  async function performSearch() {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const results = await searchComponents(searchQuery, {
        category: selectedCategory !== "all" ? selectedCategory : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        sortBy,
        minRating: minRating > 0 ? minRating : null,
        page,
        limit: 12,
      });

      if (onComponentsFound) {
        onComponentsFound(results);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    performSearch();
  }

  function handleTagToggle(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }

  function handleReset() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTags([]);
    setSortBy("recent");
    setMinRating(0);
    setPage(1);
    setShowAdvanced(false);
  }

  async function loadMostViewed() {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const results = await getMostViewedComponents(20);
      if (onComponentsFound) {
        onComponentsFound({
          items: results,
          pagination: { total: results.length, page: 1, limit: 20, pages: 1 },
        });
      }
    } catch (error) {
      console.error("Error loading most viewed:", error);
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }

  async function loadTopRated() {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const results = await getTopRatedComponents(20, 1);
      if (onComponentsFound) {
        onComponentsFound({
          items: results,
          pagination: { total: results.length, page: 1, limit: 20, pages: 1 },
        });
      }
    } catch (error) {
      console.error("Error loading top rated:", error);
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }

  return (
    <div className="advanced-search-container">
      {/* Main Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search components by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            🔍 Search
          </button>
        </div>
      </form>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button className="action-btn popular" onClick={loadMostViewed} disabled={loading}>
          🔥 Most Popular
        </button>
        <button className="action-btn top-rated" onClick={loadTopRated} disabled={loading}>
          ⭐ Top Rated
        </button>
        <button
          className={`action-btn advanced ${showAdvanced ? "active" : ""}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          ⚙️ Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-section">
            <label>Category</label>
            <div className="filter-options">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tag ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Tags</label>
            <div className="filter-options">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  className={`filter-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="recent">Most Recent</option>
              <option value="popularity">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="trending">Trending</option>
            </select>
          </div>

          <div className="filter-section">
            <label htmlFor="rating-slider">Minimum Rating: {minRating}</label>
            <input
              id="rating-slider"
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => {
                setMinRating(parseFloat(e.target.value));
                setPage(1);
              }}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>2.5</span>
              <span>5</span>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-reset" onClick={handleReset}>
              Reset Filters
            </button>
            <button className="btn-close" onClick={() => setShowAdvanced(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(searchQuery || selectedCategory !== "all" || selectedTags.length > 0 || minRating > 0) && (
        <div className="active-filters">
          {searchQuery && (
            <div className="filter-chip">
              🔍 "{searchQuery}"
              <button onClick={() => setSearchQuery("")}>×</button>
            </div>
          )}
          {selectedCategory !== "all" && (
            <div className="filter-chip">
              📁 {selectedCategory}
              <button onClick={() => setSelectedCategory("all")}>×</button>
            </div>
          )}
          {selectedTags.map((tag) => (
            <div key={tag} className="filter-chip">
              #{tag}
              <button onClick={() => handleTagToggle(tag)}>×</button>
            </div>
          ))}
          {minRating > 0 && (
            <div className="filter-chip">
              ⭐ {minRating}+
              <button onClick={() => setMinRating(0)}>×</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
