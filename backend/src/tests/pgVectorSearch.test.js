import assert from "node:assert/strict";
import test from "node:test";
import {
  ensurePgVectorSchema,
  formatPgVectorLiteral,
  getPgVectorDimensions,
  searchPgVectorEmbeddings,
} from "../services/pgVectorSearchService.js";

function testEmbedding(value = 0.01) {
  return new Array(getPgVectorDimensions()).fill(value);
}

test("formatPgVectorLiteral serializes bounded numeric vectors", () => {
  const literal = formatPgVectorLiteral(testEmbedding(0.25));
  assert.equal(literal.startsWith("["), true);
  assert.equal(literal.endsWith("]"), true);
  assert.equal(literal.split(",").length, getPgVectorDimensions());
});

test("ensurePgVectorSchema creates HNSW index when pgvector is available", async () => {
  const statements = [];
  const queryExecutor = async (text, values = []) => {
    statements.push({ text, values });
    if (String(text).startsWith("SELECT EXISTS")) {
      return { rows: [{ extension_available: true }] };
    }
    return { rows: [] };
  };

  const status = await ensurePgVectorSchema({ force: true, queryExecutor });

  assert.equal(status.available, true);
  assert.equal(status.indexed, true);
  assert.equal(status.indexType, "hnsw");
  assert.equal(statements.some((entry) => String(entry.text).includes("USING hnsw")), true);
});

test("searchPgVectorEmbeddings uses vector distance ordering", async () => {
  const statements = [];
  const queryExecutor = async (text, values = []) => {
    statements.push({ text, values });
    if (String(text).startsWith("SELECT EXISTS")) {
      return { rows: [{ extension_available: true }] };
    }
    if (String(text).includes("FROM component_vector_embeddings")) {
      return {
        rows: [{
          componentId: "cmp-forms",
          componentName: "Validated Input",
          category: "Forms",
          text: "form validation component",
          model: "deterministic-v1",
          provider: "deterministic",
          score: 0.91,
        }],
      };
    }
    return { rows: [] };
  };

  const result = await searchPgVectorEmbeddings({
    embedding: testEmbedding(0.05),
    metric: "cosine",
    category: "Forms",
    limit: 5,
    queryExecutor,
  });

  const select = statements.find((entry) => String(entry.text).includes("ORDER BY embedding <=> $1::vector"));
  assert.equal(result.available, true);
  assert.equal(result.items[0].componentId, "cmp-forms");
  assert.equal(select.values[0].startsWith("["), true);
  assert.equal(select.values[1], "Forms");
  assert.equal(select.values[2], 5);
});
