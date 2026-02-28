import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CategoryFilter,
  ComponentCard,
  Layout,
  SearchBar,
} from "@/showcase";
import { categories, components } from "@/showcase/components.data";
import "./Index.css";

const Index = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const searchText = searchQuery.trim().toLowerCase();
  const filteredComponents = components.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      searchText === "" ||
      item.name.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchText));

    return matchesCategory && matchesSearch;
  });

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

            {filteredComponents.length > 0 ? (
              <div className="component-grid">
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
