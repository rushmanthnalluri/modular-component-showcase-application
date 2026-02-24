import { useState } from "react";
import {
  CategoryFilter,
  ComponentCard,
  Layout,
  SearchBar,
} from "@/showcase";
import { components } from "@/showcase/components.data";
import "./Index.css";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
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
