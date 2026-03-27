import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CategoryFilter from "@/components/CategoryFilter";
import ComponentCard from "@/components/ComponentCard";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import { useComponents } from "@/hooks/useComponents";
import { subscribeToAuthUser } from "@/services/authAccess";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [authUser, setAuthUser] = useState(null);

  // Custom hooks — single responsibility: data fetching lives in useComponents,
  // auth subscription lives in useAuth via subscribeToAuthUser.
  const { items: componentItems, isLoading, cloudWarning, removeComponent } = useComponents();

  useEffect(() => subscribeToAuthUser(setAuthUser), []);

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

  // Derived: human-readable label for the active category.
  const activeCategoryName = useMemo(
    () => categories.find((category) => category.id === activeCategory)?.name || "All Components",
    [activeCategory]
  );

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

  // Derived: filtered view of the component list — never stored in state.
  const filteredComponents = useMemo(() => {
    const searchText = searchQuery.trim().toLowerCase();

    return componentItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        searchText === "" ||
        item.name.toLowerCase().includes(searchText) ||
        item.description.toLowerCase().includes(searchText) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchText));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, componentItems, searchQuery]);

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
              {activeCategory !== "all" ? (
                <p className="category-route-note">Viewing route category: {activeCategoryName}</p>
              ) : null}
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
            {cloudWarning ? (
              <div className="sync-warning" role="status" aria-live="polite">
                {cloudWarning} Showing bundled showcase components only.
              </div>
            ) : null}

            {isLoading ? (
              <div className="loader-wrap" role="status" aria-live="polite">
                <div className="loader" aria-hidden="true" />
                <span className="sr-only">Loading components</span>
              </div>
            ) : filteredComponents.length > 0 ? (
              <div className="component-grid">
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    id={component.id}
                    name={component.name}
                    description={component.description}
                    thumbnail={component.thumbnail}
                    canDelete={Boolean(authUser && (authUser.id === component.createdBy || authUser.role === "admin"))}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No components found. Try adjusting search or category.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
