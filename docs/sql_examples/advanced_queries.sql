-- Advanced SQL patterns used for academic CO coverage and operational analytics.

-- Recursive CTE: flatten discussion parent chain from Mongo IDs.
WITH RECURSIVE discussion_chain AS (
    SELECT
        d.mongo_discussion_id,
        d.parent_mongo_id,
        d.message,
        d.user_id,
        d.created_at,
        0 AS depth
    FROM discussions d
    WHERE d.parent_mongo_id IS NULL

    UNION ALL

    SELECT
        child.mongo_discussion_id,
        child.parent_mongo_id,
        child.message,
        child.user_id,
        child.created_at,
        parent.depth + 1
    FROM discussions child
    JOIN discussion_chain parent
      ON child.parent_mongo_id = parent.mongo_discussion_id
)
SELECT * FROM discussion_chain ORDER BY created_at DESC;

-- Window function: rank users by review contribution and average rating quality.
SELECT
    r.user_id,
    COUNT(*) AS reviews_written,
    AVG(r.rating::numeric) AS avg_review_rating,
    DENSE_RANK() OVER (ORDER BY COUNT(*) DESC, AVG(r.rating::numeric) DESC) AS contribution_rank
FROM reviews r
GROUP BY r.user_id;

-- Subquery and aggregate: identify categories with above-global-average component publication.
SELECT
    cat.category_name,
    COUNT(c.component_id) AS component_count
FROM categories cat
LEFT JOIN components c ON c.category_id = cat.category_id
GROUP BY cat.category_id, cat.category_name
HAVING COUNT(c.component_id) > (
    SELECT AVG(category_component_counts.cnt)
    FROM (
        SELECT COUNT(*)::numeric AS cnt
        FROM components
        GROUP BY category_id
    ) AS category_component_counts
)
ORDER BY component_count DESC;
