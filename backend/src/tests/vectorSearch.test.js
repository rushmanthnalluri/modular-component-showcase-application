import assert from "node:assert/strict";
import test from "node:test";
import { generateEmbedding } from "../services/embeddingProvider.js";

test("generateEmbedding returns deterministic vector when no provider configured", async () => {
  const result = await generateEmbedding({ text: "primary button component" });
  assert.equal(Array.isArray(result.embedding), true);
  assert.equal(result.embedding.length > 0, true);
  assert.equal(typeof result.embeddingHash, "string");
});
