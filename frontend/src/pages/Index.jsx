import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  const { categoryId } = useParams();
  const [authUser, setAuthUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [draftQuery, setDraftQuery] = useState("");
  const [displayedComponents, setDisplayedComponents] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const searchRequestIdRef = useRef(0);

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
      navigate({ pathname: "/" }, { replace: true });
    }
  }, [categoryId, validCategoryIds, navigate]);

  const handleCategoryChange = (nextCategory) => {
    const normalizedCategory = validCategoryIds.includes(nextCategory) ? nextCategory : "all";
    const nextPath = normalizedCategory === "all" ? "/" : `/category/${normalizedCategory}`;
    const currentPath = activeCategory === "all" ? "/" : `/category/${activeCategory}`;

    if (nextPath === currentPath) {
      return;
    }

    navigate(
      {
        pathname: nextPath,
      },
      { replace: false }
    );
  };

  const handleToggleFavorite = async (componentId) => {
    const next = await toggleFavorite(componentId);
    setFavoriteIds(next);
  };

  const baseScopedComponents = useMemo(() => {
    return componentItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesCategory;
    });
  }, [activeCategory, componentItems]);

  const componentLookup = useMemo(() => {
    return new Map(
      componentItems
        .map((component) => [String(component.id || "").trim(), component])
        .filter(([key]) => Boolean(key))
    );
  }, [componentItems]);

  const searchTerm = draftQuery.trim();

  const executeSearch = useCallback(
    async (queryText) => {
      const normalizedQuery = String(queryText || "").trim();
      const requestId = searchRequestIdRef.current + 1;
      searchRequestIdRef.current = requestId;

      if (!normalizedQuery) {
        setDisplayedComponents(baseScopedComponents);
        setSearchLoading(false);
        return;
      }

      const nextMode = detectSearchMode(normalizedQuery);
      setSearchLoading(true);

      try {
        const outcome = await unifiedComponentSearch({
          query: normalizedQuery,
          components: baseScopedComponents,
          category: activeCategory,
          limit: 12,
          mode: nextMode,
        });

        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        const enrichedResults = outcome.results.map((component) => {
          const fallback = componentLookup.get(String(component.id || "").trim());
          if (!fallback) {
            return component;
          }

          return {
            ...fallback,
            ...component,
            thumbnail: component.thumbnail || fallback.thumbnail,
          };
        });

        setDisplayedComponents(enrichedResults);
      } catch {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        setDisplayedComponents([]);
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    },
    [activeCategory, baseScopedComponents, componentLookup]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    void executeSearch(searchTerm);
  };

  // Delegate deletion to the hook which does optimistic update + rollback on error.
  const handleDelete = async (id) => {
    await removeComponent(id);
  };

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    if (!searchTerm) {
      const resetTimer = window.setTimeout(() => {
        setDisplayedComponents(baseScopedComponents);
        setSearchLoading(false);
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    searchTimerRef.current = window.setTimeout(() => {
      void executeSearch(searchTerm);
      searchTimerRef.current = null;
    }, 180);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [baseScopedComponents, executeSearch, searchTerm]);

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
            ) : displayedComponents.length > 0 ? (
              <div className="component-grid">
                {displayedComponents.map((component) => (
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
                <span>Try a different category or search term to continue exploring the catalog.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
