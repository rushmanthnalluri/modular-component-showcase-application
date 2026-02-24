import { useState } from "react";
import { motion } from "framer-motion";
import {
  CategoryFilter,
  ComponentCard,
  Layout,
  SearchBar,
  useFilteredComponents,
} from "@/features/showcase";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: filteredComponents = [], isLoading } = useFilteredComponents(
    activeCategory,
    searchQuery,
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-light/20 via-transparent to-transparent" />
        <div className="absolute top-14 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="display-font text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-foreground block">Modular Component</span>
              <span className="text-gradient block">Showcase Application</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Explore reusable components, controlled state variants, and
              prop-driven interactions in a polished single-page application
              designed for modular UI demonstration.
            </p>
            <div className="flex justify-center">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Components Section */}
      <section id="components" className="py-12">
        <div className="container">
          <div id="categories" className="mb-8">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
            </div>
          ) : filteredComponents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComponents.map((component, index) => (
                <ComponentCard
                  key={component.id}
                  id={component.id}
                  name={component.name}
                  description={component.description}
                  category={component.category}
                  thumbnail={component.thumbnail}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-lg">
                No components found. Try adjusting your search or filter.
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
