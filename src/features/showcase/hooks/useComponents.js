import { useMemo } from "react";
import { components } from "@/features/showcase/data/components";

export const useComponents = () => {
  return {
    data: components,
    isLoading: false,
    error: null,
  };
};

export const useComponent = (id) => {
  const component = useMemo(() => {
    if (!id) return undefined;
    return components.find((item) => item.id === id || item.preview === id);
  }, [id]);

  return {
    data: component,
    isLoading: false,
    error: id && !component ? new Error("Component not found") : null,
  };
};

export const useComponentsByCategory = (category) => {
  const filtered = useMemo(() => {
    if (category === "all") return components;
    return components.filter((item) => item.category === category);
  }, [category]);

  return {
    data: filtered,
    isLoading: false,
    error: null,
  };
};

export const useSearchComponents = (searchTerm) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return [];

    return components.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [normalizedSearch]);

  return {
    data: filtered,
    isLoading: false,
    error: null,
  };
};

export const useFilteredComponents = (category, searchTerm) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    return components.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [category, normalizedSearch]);

  return {
    data: filtered,
    isLoading: false,
    error: null,
  };
};
