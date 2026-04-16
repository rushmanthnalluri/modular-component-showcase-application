-- PART 1: Initial unnormalized schema (for analysis only)
-- Redundancy example: category_name, user_name, and user_email repeated per component row.
-- components_unnormalized(component_id, component_name, description, category_name, user_name, user_email, created_at)
-- Problems: update anomalies, insertion anomalies, deletion anomalies, and inconsistent category/user values.

-- PART 1: Final normalized schema (3NF)
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
    component_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT components_name_non_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_components_category_id ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);

-- PART 5: Sample data
INSERT INTO users (name, email)
VALUES
('Ava Johnson', 'ava@example.com'),
('Liam Parker', 'liam@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name)
VALUES
('Buttons'),
('Forms')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO components (name, description, category_id, user_id)
VALUES
(
    'Primary Button',
    'Reusable button with variants and loading state.',
    (SELECT category_id FROM categories WHERE category_name = 'Buttons'),
    (SELECT user_id FROM users WHERE email = 'ava@example.com')
),
(
    'Validated Input',
    'Input field with validation states and helper text.',
    (SELECT category_id FROM categories WHERE category_name = 'Forms'),
    (SELECT user_id FROM users WHERE email = 'liam@example.com')
)
ON CONFLICT DO NOTHING;

-- PART 6: Basic queries
-- 1. Get all components with category name and user name
SELECT c.component_id, c.name, c.description, cat.category_name, u.name AS created_by, c.created_at
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
JOIN users u ON u.user_id = c.user_id
ORDER BY c.created_at DESC;

-- 2. Get components by category
SELECT c.component_id, c.name, c.description
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
WHERE cat.category_name = 'Buttons'
ORDER BY c.name;

-- 3. Get components created by a specific user
SELECT c.component_id, c.name, c.description
FROM components c
JOIN users u ON u.user_id = c.user_id
WHERE u.email = 'ava@example.com'
ORDER BY c.created_at DESC;

-- 4. Search components by name (LIKE)
SELECT component_id, name, description
FROM components
WHERE name ILIKE '%button%'
ORDER BY name;
