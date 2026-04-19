import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticIds, setSemanticIds] = useState([]);

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

  // Sync search query from URL search param to local state.
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryFromUrl = searchParams.get("q") || "";
    setSearchQuery(queryFromUrl);
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

  // Keep the URL `?q=` param in sync with local search state.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const normalizedQuery = searchQuery.trim();

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
  }, [searchQuery, location.pathname, location.search, navigate]);

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
              <h1>
                <span>Modular Component</span>
                <span>Showcase Application</span>
              </h1>
              <p>
                Explore reusable components and prop-driven interactions in a
                clean single-page React application.
              </p>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
                No matching components found.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
