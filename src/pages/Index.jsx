import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CategoryFilter from "@/components/CategoryFilter";
import ComponentCard from "@/components/ComponentCard";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";

import { deleteComponent, getAllComponents, getCloudComponentsStatus } from "@/services/componentsStore";
import { subscribeToAuthUser } from "@/services/authAccess";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const [componentItems, setComponentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [cloudWarning, setCloudWarning] = useState("");

  useEffect(() => subscribeToAuthUser(setAuthUser), []);

  const validCategoryIds = useMemo(
    () => categories.map((category) => category.id),
    []
  );
  const activeCategory = useMemo(() => {
    if (!categoryId) {
      return "all";
    }
    return validCategoryIds.includes(categoryId) ? categoryId : "all";
  }, [categoryId, validCategoryIds]);
  const activeCategoryName = useMemo(
    () => categories.find((category) => category.id === activeCategory)?.name || "All Components",
    [activeCategory]
  );

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

  useEffect(() => {
    let isActive = true;

    const loadComponents = async () => {
      setIsLoading(true);
      try {
        const items = await getAllComponents();
        if (!isActive) {
          return;
        }

        setComponentItems(items);
        const syncStatus = getCloudComponentsStatus();
        setCloudWarning(syncStatus.degraded ? syncStatus.message : "");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadComponents();

    return () => {
      isActive = false;
    };
  }, []);

  const handleDelete = async (id) => {
    await deleteComponent(id);
    setComponentItems((prev) => prev.filter((component) => component.id !== id));
  };

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
