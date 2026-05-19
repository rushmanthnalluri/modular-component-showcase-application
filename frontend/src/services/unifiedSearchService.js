import { apiRequest } from "@/services/apiClient";

const DEFAULT_LIMIT = 12;
const KEYWORD_MAX_WORDS = 3;

function normalizeQuery(query) {
  return String(query || "").trim();
}

function tokenizeQuery(query) {
  return normalizeQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function clampScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric < 0) {
    return 0;
  }

  if (numeric > 1) {
    return 1;
  }

  return numeric;
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function previewText(value, length = 120) {
  const text = compactText(value);
  if (!text) {
    return "";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}...`;
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

function normalizeCategory(value) {
  return String(value || "").trim().toLowerCase();
}

function buildComponentMap(components) {
  const map = new Map();

  if (!Array.isArray(components)) {
    return map;
  }

  components.forEach((component) => {
    if (!component || typeof component !== "object") {
      return;
    }

    const keys = [component.id, component.componentId, component._id]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);

    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, component);
      }
    });
  });

  return map;
}

function normalizeComponent(component) {
  if (!component || typeof component !== "object") {
    return null;
  }

  const id = String(component.id || component.componentId || component._id || "").trim();
  if (!id) {
    return null;
  }

  const name = String(component.name || component.componentName || id).trim();
  const description = String(component.description || component.preview || component.summary || "").trim();
  const category = String(component.category || "").trim();
  const tags = normalizeTags(component.tags);
  const thumbnail = String(component.thumbnail || "").trim();

  return {
    id,
    name,
    description,
    preview: previewText(description, 140),
    category,
    tags,
    thumbnail,
  };
}

function keywordScore(query, component) {
  const normalizedQuery = normalizeQuery(query).toLowerCase();
  const tokens = tokenizeQuery(query);
  if (!normalizedQuery || tokens.length === 0 || !component) {
    return 0;
  }

  const name = String(component.name || "").toLowerCase();
  const description = String(component.description || "").toLowerCase();
  const category = String(component.category || "").toLowerCase();
  const tags = Array.isArray(component.tags)
    ? component.tags.map((tag) => String(tag || "").toLowerCase())
    : [];

  const haystacks = [name, description, category, tags.join(" ")].join(" ");
  const coverage = tokens.reduce((count, token) => count + (haystacks.includes(token) ? 1 : 0), 0) / tokens.length;

  let score = coverage * 0.78;
  if (name.includes(normalizedQuery)) {
    score += 0.17;
  }
  if (category.includes(normalizedQuery)) {
    score += 0.08;
  }
  if (tags.some((tag) => tag.includes(normalizedQuery))) {
    score += 0.12;
  }
  if (description.includes(normalizedQuery)) {
    score += 0.05;
  }
  if (name === normalizedQuery) {
    score += 0.08;
  }

  return clampScore(score);
}

function normalizeSemanticPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeSemanticResult(item, componentMap, categoryFilter) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const componentId = String(item.componentId || item.id || item._id || "").trim();
  const linkedComponent = componentMap.get(componentId) || null;
  const normalizedComponent = normalizeComponent({
    ...(linkedComponent || {}),
    id: componentId || linkedComponent?.id,
    componentId,
    name: item.componentName || item.name || linkedComponent?.name,
    description: item.description || linkedComponent?.description || item.preview || "",
    category: item.category || linkedComponent?.category || "",
    tags: Array.isArray(item.tags) ? item.tags : linkedComponent?.tags || [],
    thumbnail: linkedComponent?.thumbnail || "",
  });

  if (!normalizedComponent) {
    return null;
  }

  if (categoryFilter !== "all" && normalizeCategory(normalizedComponent.category) !== categoryFilter) {
    return null;
  }

  return {
    ...normalizedComponent,
    score: clampScore(item.score),
    scoreLabel: clampScore(item.score).toFixed(3),
    sourceType: "Semantic Match",
    sourceKey: "semantic",
    sourceTone: "semantic",
  };
}

function keywordSearch(query, components, { category = "all", limit = DEFAULT_LIMIT } = {}) {
  const normalizedCategory = normalizeCategory(category);
  const normalizedComponents = Array.isArray(components)
    ? components.map(normalizeComponent).filter(Boolean)
    : [];

  const results = normalizedComponents
    .filter((component) => normalizedCategory === "all" || normalizeCategory(component.category) === normalizedCategory)
    .map((component) => {
      const score = keywordScore(query, component);

      return {
        ...component,
        score,
        scoreLabel: score.toFixed(3),
        sourceType: "Keyword Match",
        sourceKey: "keyword",
        sourceTone: "keyword",
      };
    })
    .filter((component) => component.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, Math.max(1, Math.min(50, Number(limit) || DEFAULT_LIMIT)));

  const message = results.length > 0
    ? `Found ${results.length} keyword match${results.length === 1 ? "" : "es"}.`
    : "No exact keyword matches yet. Try a broader term or describe the UI you want.";

  return {
    query: normalizeQuery(query),
    mode: "keyword",
    sourceType: "Keyword Match",
    usedFallback: false,
    results,
    message,
  };
}

async function semanticSearch(query, components, { category = "all", limit = DEFAULT_LIMIT } = {}) {
  const normalizedQuery = normalizeQuery(query);
  const boundedLimit = Math.max(1, Math.min(50, Number(limit) || DEFAULT_LIMIT));
  const componentMap = buildComponentMap(components);
  const normalizedCategory = normalizeCategory(category);

  try {
    const payload = await apiRequest(
      `/search?q=${encodeURIComponent(normalizedQuery)}&limit=${encodeURIComponent(boundedLimit)}`,
      { method: "GET" }
    );

    const semanticItems = normalizeSemanticPayload(payload);
    const results = semanticItems
      .map((item) => normalizeSemanticResult(item, componentMap, normalizedCategory))
      .filter(Boolean)
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
      .slice(0, boundedLimit);

    if (results.length > 0) {
      return {
        query: normalizedQuery,
        mode: "semantic",
        sourceType: "Semantic Match",
        usedFallback: false,
        results,
        message: `Semantic search matched ${results.length} component${results.length === 1 ? "" : "s"}.`,
      };
    }

    const fallback = keywordSearch(normalizedQuery, components, { category, limit: boundedLimit });
    return {
      ...fallback,
      mode: "keyword",
      sourceType: "Keyword Match",
      usedFallback: true,
      message: fallback.results.length > 0
        ? "Semantic search returned no matches. Showing keyword matches instead."
        : "Semantic search returned no matches. Try adding layout, state, or interaction details.",
    };
  } catch {
    const fallback = keywordSearch(normalizedQuery, components, { category, limit: boundedLimit });
    return {
      ...fallback,
      mode: "keyword",
      sourceType: "Keyword Match",
      usedFallback: true,
      message: fallback.results.length > 0
        ? "Semantic search is unavailable right now. Showing keyword matches instead."
        : "Search is temporarily unavailable. Try a shorter keyword or retry in a moment.",
    };
  }
}

export function detectSearchMode(query) {
  return tokenizeQuery(query).length <= KEYWORD_MAX_WORDS ? "keyword" : "semantic";
}

export async function unifiedComponentSearch({
  query,
  components = [],
  category = "all",
  limit = DEFAULT_LIMIT,
  mode,
} = {}) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return {
      query: "",
      mode: "keyword",
      sourceType: "Keyword Match",
      usedFallback: false,
      results: [],
      message: "Search components, UI ideas, or describe functionality to explore the catalog.",
    };
  }

  const resolvedMode = mode || detectSearchMode(normalizedQuery);
  if (resolvedMode === "semantic") {
    return semanticSearch(normalizedQuery, components, { category, limit });
  }

  return keywordSearch(normalizedQuery, components, { category, limit });
}

export async function searchComponents(options = {}) {
  return unifiedComponentSearch(options);
}
