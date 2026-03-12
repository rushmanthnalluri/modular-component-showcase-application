import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CategoryFilter from "@/components/CategoryFilter";
import ComponentCard from "@/components/ComponentCard";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import { fetchComponents } from "@/services/mockApi";
import { deleteComponent } from "@/services/componentsStore";
import { subscribeToAuthUser } from "@/services/authAccess";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [componentItems, setComponentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => subscribeToAuthUser(setAuthUser), []);
  const validCategoryIds = useMemo(
    () => categories.map((category) => category.id),
    []
  );

  useEffect(() => {
    let isActive = true;

    const loadComponents = async () => {
      setIsLoading(true);
      try {
        const items = await fetchComponents();
        if (!isActive) {
          return;
        }

        setComponentItems(items);
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
    setComponentItems((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryFromQuery = searchParams.get("category");
    const queryFromUrl = searchParams.get("q") || "";

    setSearchQuery(queryFromUrl);

    if (categoryFromQuery && validCategoryIds.includes(categoryFromQuery)) {
      setActiveCategory(categoryFromQuery);
      return;
    }

    setActiveCategory("all");
  }, [location.search, validCategoryIds]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (activeCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", activeCategory);
    }

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
  }, [activeCategory, searchQuery, location.pathname, location.search, navigate]);

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
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </section>

        <section id="components" className="index-components">
          <div className="layout-container">
            <div id="categories" className="category-block">
              <CategoryFilter
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>

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
