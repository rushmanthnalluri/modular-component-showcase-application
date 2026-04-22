import assert from "node:assert/strict";
import test from "node:test";
import { runHybridSearch } from "../services/hybridSearchService.js";

test("runHybridSearch combines lexical and vector scores", async () => {
  const Component = {
    find: () => ({
      select: () => ({
        limit: () => ({
          lean: async () => [
            { id: "button-1", name: "Primary Button", description: "Call to action", category: "buttons", tags: ["cta"] },
            { id: "table-1", name: "Data Table", description: "Shows rows", category: "data", tags: ["grid"] },
          ],
        }),
      }),
    }),
  };

  const ComponentEmbedding = {
    find: () => ({
      select: () => ({
        lean: async () => [
          { componentId: "button-1", embedding: [0.8, 0.2, 0.1] },
          { componentId: "table-1", embedding: [0.1, 0.9, 0.3] },
        ],
      }),
    }),
  };

  const items = await runHybridSearch({
    query: "button",
    Component,
    ComponentEmbedding,
    limit: 2,
  });

  assert.equal(items.length, 2);
  assert.equal(typeof items[0].score, "number");
});
