import { components } from "@/data/components.data";

function createComponentsApi() {
  let fetchCount = 0;
  let lastFetchAt = null;
  let cache = null;

  return {
    async fetchComponents() {
      if (cache) {
        return cache;
      }

      fetchCount += 1;
      lastFetchAt = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 120));

      cache = components;
      void fetchCount;
      void lastFetchAt;

      return cache;
    },
  };
}

const componentsApi = createComponentsApi();

export async function fetchComponents() {
  return componentsApi.fetchComponents();
}