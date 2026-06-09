INSERT INTO users (name, full_name, email, phone, role)
VALUES ('Spring User', 'Spring User', 'spring.user@example.com', '1234567890', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, full_name, email, phone, role)
VALUES ('Spring Admin', 'Spring Admin', 'spring.admin@example.com', '1234567899', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name)
VALUES ('Spring Components')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO components (name, description, category_id, user_id)
SELECT 'Spring Card', 'Card component seeded by Spring service.', c.category_id, u.user_id
FROM categories c
JOIN users u ON u.email = 'spring.user@example.com'
WHERE c.category_name = 'Spring Components'
ON CONFLICT DO NOTHING;
