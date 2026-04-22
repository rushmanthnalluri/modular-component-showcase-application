-- Materialized views for read-heavy analytics.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_component_quality_snapshot AS
SELECT
    c.component_id,
    c.name,
    c.category_id,
    COUNT(DISTINCT r.rating_id) AS rating_events,
    COALESCE(AVG(r.rating::numeric), 0) AS avg_rating,
    COUNT(DISTINCT rv.review_id) AS review_events,
    NOW() AS snapshot_at
FROM components c
LEFT JOIN ratings r ON r.component_mongo_id = c.name
LEFT JOIN reviews rv ON rv.component_mongo_id = c.name
GROUP BY c.component_id, c.name, c.category_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_component_quality_snapshot_component_id
ON mv_component_quality_snapshot(component_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_outbox_operational_summary AS
SELECT
    status,
    COUNT(*) AS event_count,
    MAX(created_at) AS latest_created_at,
    MAX(processed_at) AS latest_processed_at
FROM service_outbox
GROUP BY status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_outbox_operational_summary_status
ON mv_outbox_operational_summary(status);

-- To refresh without blocking reads after initial population:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_component_quality_snapshot;
