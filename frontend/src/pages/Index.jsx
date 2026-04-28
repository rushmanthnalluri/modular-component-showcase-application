import { useMemo, useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import CategoryFilter from "@/components/common/CategoryFilter";
import ComponentCard from "@/components/common/ComponentCard";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/search/SearchBar";
import { useComponents } from "@/hooks/useComponents";
import { subscribeToAuthUser } from "@/services/authAccess";
import { getFavoriteIds, toggleFavorite } from "@/services/favoritesService";
import { semanticComponentSearch } from "@/services/componentEngagementService";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const [authUser, setAuthUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticIds, setSemanticIds] = useState([]);
  const [uiPrompt, setUiPrompt] = useState("A compact onboarding form with validation and success feedback");
  const [uiMatches, setUiMatches] = useState([]);
  const [uiMatchesLoading, setUiMatchesLoading] = useState(false);
  const [uiMatchesStatus, setUiMatchesStatus] = useState("Describe a UI to get semantic component matches.");

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

  const handleUiMatchSubmit = async (event) => {
    event.preventDefault();
    const trimmedPrompt = uiPrompt.trim();
    if (!trimmedPrompt) {
      setUiMatches([]);
      setUiMatchesStatus("Enter a short UI description to search the component catalog.");
      return;
    }

    setUiMatchesLoading(true);
    setUiMatchesStatus("Finding semantically similar components...");
    try {
      const items = await semanticComponentSearch(trimmedPrompt, 5);
      setUiMatches(items);
      setUiMatchesStatus(
        items.length > 0
          ? `Matched ${items.length} components using vector search over component metadata.`
          : "No strong matches yet. Try adding more detail, like layout, state, or interaction goals."
      );
    } catch {
      setUiMatches([]);
      setUiMatchesStatus("The recommendation service is temporarily unavailable.");
    } finally {
      setUiMatchesLoading(false);
    }
  };

  const setSearchQuery = useCallback((nextQuery) => {
    const params = new URLSearchParams(location.search);
    const normalizedQuery = String(nextQuery || "").trim();

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
  }, [location.pathname, location.search, navigate]);

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

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const queryTokens = useMemo(
    () => normalizedQuery.split(/\s+/).filter(Boolean),
    [normalizedQuery]
  );
  const shouldUseSemanticSearch = queryTokens.length >= 2;

  const keywordRankedComponents = useMemo(() => {
    if (!normalizedQuery) {
      return baseScopedComponents;
    }

    const scored = baseScopedComponents
      .map((item) => {
        const name = String(item.name || "").toLowerCase();
        const description = String(item.description || "").toLowerCase();
        const category = String(item.category || "").toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag || "").toLowerCase()) : [];

        const hasMatch =
          name.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          category.includes(normalizedQuery) ||
          tags.some((tag) => tag.includes(normalizedQuery));

        if (!hasMatch) {
          return null;
        }

        let score = 0;
        if (name.includes(normalizedQuery)) score += 5;
        if (category.includes(normalizedQuery)) score += 4;
        if (tags.some((tag) => tag.includes(normalizedQuery))) score += 3;
        if (description.includes(normalizedQuery)) score += 2;
        if (name === normalizedQuery) score += 3;

        return { item, score };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score || String(left.item.name).localeCompare(String(right.item.name)));

    return scored.map((entry) => entry.item);
  }, [baseScopedComponents, normalizedQuery]);

  useEffect(() => {
    let active = true;

    const runHybridSearch = async () => {
      if (!shouldUseSemanticSearch || !normalizedQuery) {
        setSemanticIds([]);
        return;
      }

      setSemanticLoading(true);
      try {
        const items = await semanticComponentSearch(normalizedQuery, 24);
        if (!active) {
          return;
        }
        setSemanticIds(items.map((item) => String(item.componentId || "")).filter(Boolean));
      } catch {
        if (active) setSemanticIds([]);
      } finally {
        if (active) {
          setSemanticLoading(false);
        }
      }
    };

    runHybridSearch();
    return () => {
      active = false;
    };
  }, [normalizedQuery, shouldUseSemanticSearch]);

  const visibleComponents = useMemo(() => {
    if (!normalizedQuery) {
      return baseScopedComponents;
    }

    if (!shouldUseSemanticSearch) {
      return keywordRankedComponents;
    }

    if (semanticIds.length === 0) {
      return keywordRankedComponents;
    }

    const mapById = new Map(baseScopedComponents.map((item) => [item.id, item]));
    const keywordIds = new Set(keywordRankedComponents.map((item) => item.id));
    const merged = [...keywordRankedComponents];

    semanticIds.forEach((id) => {
      if (!keywordIds.has(id)) {
        const candidate = mapById.get(id);
        if (candidate) {
          merged.push(candidate);
        }
      }
    });

    return merged;
  }, [baseScopedComponents, keywordRankedComponents, normalizedQuery, semanticIds, shouldUseSemanticSearch]);

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
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="hero-favorites-link-wrap">
                  <Link className="hero-favorites-link" to="/favorites">
                    Favorites
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="innovation-section" aria-labelledby="innovation-heading">
          <div className="layout-container">
            <div className="innovation-panel">
              <div className="innovation-copy">
                <span className="innovation-kicker">Innovation feature</span>
                <h2 id="innovation-heading">Describe UI, get matching components</h2>
                <p>
                  Describe the interface you want in plain language and the system
                  returns semantically related components from the vector index.
                </p>
                <form className="innovation-form" onSubmit={handleUiMatchSubmit}>
                  <label className="sr-only" htmlFor="innovation-prompt">
                    Describe the UI you want
                  </label>
                  <textarea
                    id="innovation-prompt"
                    className="innovation-textarea"
                    value={uiPrompt}
                    onChange={(event) => setUiPrompt(event.target.value)}
                    placeholder="A compact onboarding flow with validation, helper text, and a success state"
                    rows={4}
                  />
                  <div className="innovation-actions">
                    <button className="innovation-button" type="submit" disabled={uiMatchesLoading}>
                      {uiMatchesLoading ? "Searching..." : "Find matches"}
                    </button>
                    <span className="innovation-status">{uiMatchesStatus}</span>
                  </div>
                </form>
              </div>

              <div className="innovation-results" aria-live="polite">
                {uiMatches.length > 0 ? (
                  uiMatches.map((match) => (
                    <article key={`${match.componentId}-${match.componentName}`} className="innovation-result-card">
                      <div className="innovation-result-header">
                        <strong>{match.componentName}</strong>
                        <span>{match.category}</span>
                      </div>
                      <p>Semantic score {Number(match.score || 0).toFixed(3)}</p>
                    </article>
                  ))
                ) : (
                  <div className="innovation-results-empty">
                    Try prompts like “auth form with email validation” or “data table with filters and empty state”.
                  </div>
                )}
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
            {isLoading || semanticLoading ? (
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
                <span>Try a different keyword or switch to another category to continue exploring.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
