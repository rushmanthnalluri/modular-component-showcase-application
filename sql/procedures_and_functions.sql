-- Stored procedures and helper functions for operational consistency.

CREATE OR REPLACE FUNCTION fn_component_rating_summary(target_component_mongo_id text)
RETURNS TABLE (
    component_mongo_id text,
    rating_count bigint,
    average_rating numeric
)
LANGUAGE sql
AS $$
    SELECT
        r.component_mongo_id,
        COUNT(*)::bigint AS rating_count,
        COALESCE(AVG(r.rating::numeric), 0) AS average_rating
    FROM ratings r
    WHERE r.component_mongo_id = target_component_mongo_id
    GROUP BY r.component_mongo_id;
$$;

CREATE OR REPLACE PROCEDURE sp_refresh_component_stats(target_component_mongo_id text)
LANGUAGE plpgsql
AS $$
DECLARE
    summary_record record;
BEGIN
    SELECT * INTO summary_record FROM fn_component_rating_summary(target_component_mongo_id);

    IF summary_record IS NULL THEN
        RETURN;
    END IF;

    UPDATE components
    SET updated_at = NOW()
    WHERE EXISTS (
        SELECT 1
        FROM ratings r
        WHERE r.component_mongo_id = target_component_mongo_id
    );
END;
$$;

CREATE OR REPLACE PROCEDURE sp_acknowledge_outbox_event(target_event_id uuid, target_status text, target_error text DEFAULT NULL)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE service_outbox
    SET
        status = COALESCE(NULLIF(trim(target_status), ''), status),
        attempts = attempts + 1,
        last_error = target_error,
        processed_at = NOW()
    WHERE event_id = target_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_cleanup_expired_idempotency_keys()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM idempotency_keys
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
