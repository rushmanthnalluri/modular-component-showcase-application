import { useState } from "react";
import {
  CategoryFilter,
  ComponentCard,
  Layout,
  SearchBar,
  useFilteredComponents,
} from "@/features/showcase";
import "./Index.css";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: filteredComponents = [], isLoading } = useFilteredComponents(
    activeCategory,
    searchQuery,
  );

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
              <div className="loader-wrap">
                <div className="loader" />
              </div>
            ) : filteredComponents.length > 0 ? (
              <div className="component-grid">
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    id={component.id}
                    name={component.name}
                    description={component.description}
                    category={component.category}
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
