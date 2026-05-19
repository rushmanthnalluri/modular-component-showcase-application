import { hasSqlConnectionConfig, sqlQuery } from "../sql/db.js";
import { normalizeEmbedding } from "./vectorSearchService.js";

const DEFAULT_VECTOR_DIMENSIONS = 128;
const VECTOR_DIMENSIONS = Math.max(
  1,
  Math.min(2000, Number.parseInt(process.env.PGVECTOR_DIMENSIONS || String(DEFAULT_VECTOR_DIMENSIONS), 10) || DEFAULT_VECTOR_DIMENSIONS)
);

let cachedSchemaStatus = null;

function boundedLimit(value, fallback = 10) {
  return Math.max(1, Math.min(50, Number(value) || fallback));
}

function safeMetric(value) {
  const metric = String(value || "cosine").trim().toLowerCase();
  if (metric === "dot" || metric === "dot_product") {
    return "dot";
  }
  if (metric === "euclidean" || metric === "l2") {
    return "euclidean";
  }
  return "cosine";
}

function metricSql(metric) {
  const normalizedMetric = safeMetric(metric);
  if (normalizedMetric === "dot") {
    return {
      distanceExpression: "embedding <#> $1::vector",
      scoreExpression: "-1 * (embedding <#> $1::vector)",
    };
  }
  if (normalizedMetric === "euclidean") {
    return {
      distanceExpression: "embedding <-> $1::vector",
      scoreExpression: "1 / (1 + (embedding <-> $1::vector))",
    };
  }
  return {
    distanceExpression: "embedding <=> $1::vector",
    scoreExpression: "1 - (embedding <=> $1::vector)",
  };
}

export function isPgVectorDimensionCompatible(embedding) {
  return normalizeEmbedding(embedding).length === VECTOR_DIMENSIONS;
}

export function formatPgVectorLiteral(embedding) {
  const normalized = normalizeEmbedding(embedding);
  if (normalized.length !== VECTOR_DIMENSIONS) {
    throw new Error(`pgvector embeddings must contain exactly ${VECTOR_DIMENSIONS} dimensions.`);
  }

  return `[${normalized.map((entry) => String(Number(entry))).join(",")}]`;
}

export function getPgVectorDimensions() {
  return VECTOR_DIMENSIONS;
}

export async function ensurePgVectorSchema({ force = false, queryExecutor = sqlQuery } = {}) {
  if (queryExecutor === sqlQuery && !hasSqlConnectionConfig()) {
    return { available: false, reason: "sql_not_configured", indexed: false, dimensions: VECTOR_DIMENSIONS };
  }

  if (!force && cachedSchemaStatus && queryExecutor === sqlQuery) {
    return cachedSchemaStatus;
  }

  let status = { available: false, reason: "unknown", indexed: false, dimensions: VECTOR_DIMENSIONS };

  try {
    const availability = await queryExecutor(
      "SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') AS extension_available"
    );

    if (!availability.rows?.[0]?.extension_available) {
      status = { ...status, reason: "extension_unavailable" };
      return status;
    }

    await queryExecutor("CREATE EXTENSION IF NOT EXISTS vector");
    await queryExecutor(`
      CREATE TABLE IF NOT EXISTS component_vector_embeddings (
        component_id TEXT PRIMARY KEY,
        component_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        text TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL DEFAULT '',
        provider TEXT NOT NULL DEFAULT '',
        embedding_hash TEXT NOT NULL DEFAULT '',
        embedding vector(${VECTOR_DIMENSIONS}) NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryExecutor(`
      CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_category
      ON component_vector_embeddings (lower(category))
    `);

    let indexed = false;
    let indexType = null;
    try {
      await queryExecutor(`
        CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_embedding_hnsw
        ON component_vector_embeddings
        USING hnsw (embedding vector_cosine_ops)
      `);
      indexed = true;
      indexType = "hnsw";
    } catch {
      try {
        await queryExecutor(`
          CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_embedding_ivfflat
          ON component_vector_embeddings
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `);
        indexed = true;
        indexType = "ivfflat";
      } catch {
        indexed = false;
      }
    }

    status = {
      available: true,
      reason: indexed ? "ready" : "table_ready_index_unavailable",
      indexed,
      indexType,
      dimensions: VECTOR_DIMENSIONS,
    };
    return status;
  } catch (error) {
    status = {
      ...status,
      reason: "schema_initialization_failed",
      error: error.message,
    };
    return status;
  } finally {
    if (queryExecutor === sqlQuery) {
      cachedSchemaStatus = status;
    }
  }
}

export async function upsertPgVectorEmbedding({
  componentId,
  componentName,
  category = "",
  text = "",
  model = "",
  provider = "",
  embeddingHash = "",
  embedding,
  metadata = {},
  queryExecutor = sqlQuery,
}) {
  const schema = await ensurePgVectorSchema({ queryExecutor });
  if (!schema.available || !isPgVectorDimensionCompatible(embedding)) {
    return { available: false, schema, item: null };
  }

  const vectorLiteral = formatPgVectorLiteral(embedding);
  const result = await queryExecutor(
    `
      INSERT INTO component_vector_embeddings (
        component_id, component_name, category, text, model, provider, embedding_hash, embedding, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9::jsonb)
      ON CONFLICT (component_id) DO UPDATE SET
        component_name = EXCLUDED.component_name,
        category = EXCLUDED.category,
        text = EXCLUDED.text,
        model = EXCLUDED.model,
        provider = EXCLUDED.provider,
        embedding_hash = EXCLUDED.embedding_hash,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING
        component_id AS "componentId",
        component_name AS "componentName",
        category,
        text,
        model,
        provider,
        embedding_hash AS "embeddingHash",
        updated_at AS "updatedAt"
    `,
    [
      String(componentId || "").trim(),
      String(componentName || "").trim(),
      String(category || "").trim(),
      String(text || "").trim(),
      String(model || "").trim(),
      String(provider || "").trim(),
      String(embeddingHash || "").trim(),
      vectorLiteral,
      JSON.stringify(metadata && typeof metadata === "object" ? metadata : {}),
    ]
  );

  return { available: true, schema, item: result.rows?.[0] || null };
}

export async function searchPgVectorEmbeddings({
  embedding,
  metric = "cosine",
  category = "",
  limit = 10,
  queryExecutor = sqlQuery,
}) {
  const schema = await ensurePgVectorSchema({ queryExecutor });
  if (!schema.available || !isPgVectorDimensionCompatible(embedding)) {
    return { available: false, schema, items: [] };
  }

  const vectorLiteral = formatPgVectorLiteral(embedding);
  const { distanceExpression, scoreExpression } = metricSql(metric);
  const result = await queryExecutor(
    `
      SELECT
        component_id AS "componentId",
        component_name AS "componentName",
        category,
        text,
        model,
        provider,
        ${scoreExpression} AS score
      FROM component_vector_embeddings
      WHERE ($2::text = '' OR lower(category) = lower($2::text))
      ORDER BY ${distanceExpression}
      LIMIT $3
    `,
    [vectorLiteral, String(category || "").trim(), boundedLimit(limit)]
  );

  return {
    available: true,
    schema,
    items: (result.rows || []).map((item) => ({
      componentId: item.componentId,
      componentName: item.componentName,
      category: item.category,
      text: item.text,
      model: item.model,
      provider: item.provider,
      score: Number(Number(item.score || 0).toFixed(6)),
    })),
  };
}
