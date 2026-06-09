-- Enterprise additive SQL: views and triggers

CREATE OR REPLACE VIEW vw_component_catalog AS
SELECT
    c.component_id,
    c.name,
    c.description,
    cat.category_name,
    u.user_id,
    u.name AS author_name,
    c.created_at,
    c.updated_at
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
JOIN users u ON u.user_id = c.user_id;

CREATE OR REPLACE VIEW vw_component_engagement AS
SELECT
    r.component_mongo_id,
    COUNT(*) FILTER (WHERE r.rating = 5) AS five_star_count,
    AVG(r.rating::numeric) AS average_rating,
    COUNT(*) AS rating_count
FROM ratings r
GROUP BY r.component_mongo_id;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_components_updated_at ON components;
CREATE TRIGGER trg_components_updated_at
BEFORE UPDATE ON components
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
