import { useMemo, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import CategoryFilter from "@/components/common/CategoryFilter";
import ComponentCard from "@/components/common/ComponentCard";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/search/SearchBar";
import { useComponents } from "@/hooks/useComponents";
import { subscribeToAuthUser } from "@/services/authAccess";
import { getFavoriteIds, toggleFavorite } from "@/services/favoritesService";
import { detectSearchMode, unifiedComponentSearch } from "@/services/unifiedSearchService";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const [authUser, setAuthUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [draftQuery, setDraftQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(
    "Search components, UI ideas, or describe functionality to explore the catalog."
  );

  // Custom hooks — single responsibility: data fetching lives in useComponents,
  // auth subscription lives in useAuth via subscribeToAuthUser.
  const { items: componentItems, isLoading, removeComponent } = useComponents();

  useEffect(() => subscribeToAuthUser(setAuthUser), []);
  useEffect(() => {
    let active = true;
    getFavoriteIds().then((ids) => {
      if (active) setFavoriteIds(ids);
    });
    return () => {
      active = false;
    };
  }, []);

  // Derived: list of valid category id strings (stable across renders via useMemo).
  const validCategoryIds = useMemo(
    () => categories.map((category) => category.id),
    []
  );

  // Derived: resolved active category from the URL param.
  const activeCategory = useMemo(() => {
    if (!categoryId) {
      return "all";
    }
    return validCategoryIds.includes(categoryId) ? categoryId : "all";
  }, [categoryId, validCategoryIds]);

  // Redirect invalid or "all" category routes back to the root path.
  useEffect(() => {
    if (!categoryId) {
      return;
    }

    if (categoryId === "all" || !validCategoryIds.includes(categoryId)) {
      navigate(
        {
          pathname: "/",
          search: location.search,
        },
        { replace: true }
      );
    }
  }, [categoryId, validCategoryIds, navigate, location.search]);

  const searchQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("q") || "";
  }, [location.search]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setDraftQuery(searchQuery);
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
    };
  }, [searchQuery]);

  const handleCategoryChange = (nextCategory) => {
    const normalizedCategory = validCategoryIds.includes(nextCategory) ? nextCategory : "all";
    const nextPath = normalizedCategory === "all" ? "/" : `/category/${normalizedCategory}`;

    if (nextPath === location.pathname) {
      return;
    }

    navigate(
      {
        pathname: nextPath,
        search: location.search,
      },
      { replace: false }
    );
  };

  const handleToggleFavorite = async (componentId) => {
    const next = await toggleFavorite(componentId);
    setFavoriteIds(next);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalizedQuery = draftQuery.trim();
    const params = new URLSearchParams(location.search);

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }

    const nextSearch = params.toString() ? `?${params.toString()}` : "";
    if (nextSearch !== location.search) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch,
        },
        { replace: true }
      );
    }
  };

  // Delegate deletion to the hook which does optimistic update + rollback on error.
  const handleDelete = async (id) => {
    await removeComponent(id);
  };

  const baseScopedComponents = useMemo(() => {
    return componentItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesCategory;
    });
  }, [activeCategory, componentItems]);

  useEffect(() => {
    let active = true;
    let timerId = null;

    const runSearch = async () => {
      if (!searchQuery.trim()) {
        if (active) {
          setSearchResults([]);
          setSearchMessage("Search components, UI ideas, or describe functionality to explore the catalog.");
          setSearchLoading(false);
        }
        return;
      }

      const nextMode = detectSearchMode(searchQuery);
      if (nextMode === "semantic") {
        setSearchLoading(true);
        timerId = window.setTimeout(() => {
          void (async () => {
            try {
              const outcome = await unifiedComponentSearch({
                query: searchQuery,
                components: baseScopedComponents,
                category: activeCategory,
                limit: 12,
                mode: nextMode,
              });

              if (!active) {
                return;
              }

              setSearchResults(outcome.results);
              setSearchMessage(outcome.message);
            } catch {
              if (!active) {
                return;
              }

              setSearchResults([]);
              setSearchMessage("Search is temporarily unavailable. Try a shorter keyword or retry in a moment.");
            } finally {
              if (active) {
                setSearchLoading(false);
              }
            }
          })();
        }, 220);
        return;
      }

      setSearchLoading(false);
      try {
        const outcome = await unifiedComponentSearch({
          query: searchQuery,
          components: baseScopedComponents,
          category: activeCategory,
          limit: 12,
          mode: nextMode,
        });

        if (!active) {
          return;
        }

        setSearchResults(outcome.results);
        setSearchMessage(outcome.message);
      } catch {
        if (!active) {
          return;
        }

        setSearchResults([]);
        setSearchMessage("Search is temporarily unavailable. Try a shorter keyword or retry in a moment.");
      }
    };

    runSearch();
    return () => {
      active = false;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [activeCategory, baseScopedComponents, searchQuery]);

  const hasSearchQuery = Boolean(searchQuery.trim());
  const visibleComponents = hasSearchQuery ? searchResults : baseScopedComponents;

  return (
    <Layout>
      <div className="index-page">
        <section className="index-hero">
          <div className="layout-container">
            <div className="hero-content">
              <div className="hero-copy">
                <span className="hero-kicker">Reusable UI system</span>
                <h1>
                  <span>Modular Component</span>
                  <span>Showcase Application</span>
                </h1>
                <p>
                  Explore reusable components and prop-driven interactions in a
                  clean single-page React application.
                </p>
                <form className="hero-search-form" onSubmit={handleSearchSubmit}>
                  <div className="hero-search-row">
                    <SearchBar
                      value={draftQuery}
                      onChange={setDraftQuery}
                      placeholder="Search components, UI ideas, or describe functionality..."
                      label="Unified component search"
                      inputId="unified-component-search"
                    />
                    <button
                      className="hero-search-button hero-pill-control"
                      type="submit"
                      disabled={searchLoading}
                    >
                      {searchLoading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </form>
                <div className="hero-favorites-link-wrap">
                  <Link className="hero-favorites-link hero-pill-control" to="/favorites">
                    Favorites
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasSearchQuery ? (
          <section className="search-results-section" aria-labelledby="search-results-heading">
            <div className="layout-container">
              <div className="search-results-shell">
                <div className="search-results-header">
                  <h2 id="search-results-heading">Search results</h2>
                  <span className="search-results-summary">{searchMessage}</span>
                </div>

                <div className="unified-search-results" aria-live="polite">
                  {searchLoading ? (
                    <div className="loader-wrap" role="status" aria-live="polite">
                      <div className="loader" aria-hidden="true" />
                      <span className="sr-only">Loading search results</span>
                    </div>
                  ) : visibleComponents.length > 0 ? (
                    visibleComponents.map((component) => (
                      <article key={component.id} className="unified-search-result-card">
                        <div className="unified-search-result-header">
                          <div>
                            <span
                              className={
                                component.sourceType === "Semantic Match"
                                  ? "search-result-chip semantic"
                                  : "search-result-chip keyword"
                              }
                            >
                              {component.sourceType}
                            </span>
                            <h3>{component.name}</h3>
                          </div>
                          <strong className="unified-search-score">{component.scoreLabel}</strong>
                        </div>
                        <p>{component.preview || component.description}</p>
                        <div className="unified-search-result-meta">
                          <span>{component.category || "Uncategorized"}</span>
                          <span>Relevance {component.scoreLabel}</span>
                        </div>
                        {Array.isArray(component.tags) && component.tags.length > 0 ? (
                          <div className="component-card-tags" aria-label="Result tags">
                            {component.tags.slice(0, 6).map((tag) => (
                              <span key={tag} className="component-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <Link className="unified-search-link" to={`/component/${component.id}`}>
                          View component
                        </Link>
                      </article>
                    ))
                  ) : (
                    <div className="unified-search-empty">
                      <strong>No matching components found.</strong>
                      <span>{searchMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!hasSearchQuery ? (
          <section id="components" className="index-components">
            <div className="layout-container">
              <div id="categories" className="category-block">
                <CategoryFilter
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
              {isLoading ? (
                <div className="loader-wrap" role="status" aria-live="polite">
                  <div className="loader" aria-hidden="true" />
                  <span className="sr-only">Loading components</span>
                </div>
              ) : visibleComponents.length > 0 ? (
                <div className="component-grid">
                  {visibleComponents.map((component) => (
                    <ComponentCard
                      key={component.id}
                      id={component.id}
                      name={component.name}
                      description={component.description}
                      thumbnail={component.thumbnail}
                      tags={component.tags}
                      isFavorite={favoriteIds.includes(component.id)}
                      onToggleFavorite={handleToggleFavorite}
                      averageRating={component.averageRating}
                      totalReviews={component.totalReviews}
                      canDelete={Boolean(authUser && (authUser.id === component.createdBy || authUser.role === "admin"))}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No matching components found.</strong>
                  <span>Try a different category to continue exploring the catalog.</span>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </Layout>
  );
};

export default Index;
