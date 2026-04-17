import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ComponentCard from "@/components/common/ComponentCard";
import { getAllComponents } from "@/services/componentsStore";
import { getFavoriteIds, toggleFavorite } from "@/services/favoritesService";
import { useToast } from "@/use-toast";
import "./Favorites.css";

const Favorites = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [items, ids] = await Promise.all([getAllComponents(), getFavoriteIds()]);
        if (!active) {
          return;
        }
        setComponents(items);
        setFavoriteIds(ids);
      } catch {
        if (active) {
          toast({
            title: "Unable to load favorites",
            description: "Please try again in a moment.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleToggleFavorite = async (componentId) => {
    const next = await toggleFavorite(componentId);
    setFavoriteIds(next);
  };

  const favoriteComponents = components.filter((component) => favoriteIds.includes(component.id));

  return (
    <Layout>
      <div className="layout-container favorites-page">
        <h1>Favorite Components</h1>
        <p>All components you marked as favorite are listed here.</p>

        {isLoading ? (
          <div className="favorites-loading">Loading favorites...</div>
        ) : favoriteComponents.length > 0 ? (
          <div className="component-grid">
            {favoriteComponents.map((component) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="favorites-empty">No favorites yet. Add some from the home page.</div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
