import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import CategoryFilter from "@/components/CategoryFilter";
import ComponentCard from "@/components/ComponentCard";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import { fetchComponents } from "@/services/mockApi";
import { categories } from "@/data/components.data";
import "./Index.css";

const Index = () => {
  const location = useLocation();
  const [componentItems, setComponentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryFromQuery = searchParams.get("category");
    const validCategoryIds = categories.map((category) => category.id);

    if (categoryFromQuery && validCategoryIds.includes(categoryFromQuery)) {
      setActiveCategory(categoryFromQuery);
      return;
    }

    setActiveCategory("all");
  }, [location.search]);

  const filteredComponents = useMemo(() => {
    // Declarative rendering: derived data is computed from current state and props.
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
              {/* Lifted state pattern: Index owns search state; SearchBar updates it via props. */}
              {/* State-based re-rendering: setSearchQuery triggers React to re-evaluate this tree. */}
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </section>

        <section id="components" className="index-components">
          <div className="layout-container">
            <div id="categories" className="category-block">
              {/* Lifted state pattern: Index owns category state; CategoryFilter receives value + setter. */}
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
                {/* Declarative list rendering: UI is produced from data, not manual DOM operations. */}
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    id={component.id}
                    name={component.name}
                    description={component.description}
                    thumbnail={component.thumbnail}
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
