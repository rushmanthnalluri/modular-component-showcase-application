-- V2__seed_data.sql
-- Seed initial showcase data.  ON CONFLICT guards make this idempotent.

INSERT INTO users (name, full_name, email, phone, role)
VALUES ('Spring User',  'Spring User',  'spring.user@example.com',  '1234567890', 'user'),
       ('Spring Admin', 'Spring Admin', 'spring.admin@example.com', '1234567899', 'admin'),
       ('Spring Dev',   'Spring Dev',   'spring.dev@example.com',   '1234567891', 'developer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name)
VALUES ('Spring Components'),
       ('UI Elements'),
       ('Layout')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO components (name, description, category_id, user_id)
SELECT 'Spring Card',
       'Reusable card component seeded by Spring service.',
       c.category_id,
       u.user_id
FROM   categories c
JOIN   users u ON u.email = 'spring.user@example.com'
WHERE  c.category_name = 'Spring Components'
ON CONFLICT DO NOTHING;
