-- Query plan and index optimization examples.

-- 1) Ratings by component id path
EXPLAIN (ANALYZE, BUFFERS)
SELECT component_mongo_id, COUNT(*) AS rating_count, AVG(rating::numeric) AS avg_rating
FROM ratings
WHERE component_mongo_id = 'primary-button'
GROUP BY component_mongo_id;

-- Suggested supporting index (already additive-safe):
CREATE INDEX IF NOT EXISTS idx_ratings_component_created_at
ON ratings(component_mongo_id, created_at DESC);

-- 2) Discussion timeline optimization
EXPLAIN (ANALYZE, BUFFERS)
SELECT mongo_discussion_id, message, created_at
FROM discussions
WHERE component_mongo_id = 'primary-button'
ORDER BY created_at DESC
LIMIT 50;

CREATE INDEX IF NOT EXISTS idx_discussions_component_created_at
ON discussions(component_mongo_id, created_at DESC);

-- 3) User contribution leaderboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, COUNT(*) AS contribution_count
FROM reviews
GROUP BY user_id
ORDER BY contribution_count DESC
LIMIT 20;

CREATE INDEX IF NOT EXISTS idx_reviews_user_created_at
ON reviews(user_id, created_at DESC);
