import { sqlQuery } from "../sql/db.js";

function mapUser(row) {
    return {
        userId: row.user_id,
        mongoUserId: row.mongo_user_id || null,
        name: row.name,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        isVerifiedDeveloper: Boolean(row.is_verified_developer),
        bio: row.bio,
        avatarUrl: row.avatar_url,
        socialLinks: row.social_links,
        stats: row.stats,
        emailPreferences: row.email_preferences,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapCategory(row) {
    return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        createdAt: row.created_at,
    };
}

function mapComponent(row) {
    return {
        componentId: row.component_id,
        name: row.name,
        description: row.description,
        categoryId: row.category_id,
        userId: row.user_id,
        categoryName: row.category_name,
        userName: row.user_name,
        userEmail: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listUsers() {
    const { rows } = await sqlQuery("SELECT * FROM users ORDER BY user_id ASC");
    return rows.map(mapUser);
}

export async function getUserById(userId) {
    const { rows } = await sqlQuery("SELECT * FROM users WHERE user_id = $1", [userId]);
    return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUser({ name, email }) {
    const { rows } = await sqlQuery(
        `INSERT INTO users(name, email)
         VALUES ($1, $2)
         RETURNING *`,
        [name, email]
    );
    return mapUser(rows[0]);
}

export async function updateUser(userId, { name, email }) {
    const { rows } = await sqlQuery(
        `UPDATE users
         SET name = COALESCE($2, name),
             email = COALESCE($3, email),
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [userId, name ?? null, email ?? null]
    );
    return rows[0] ? mapUser(rows[0]) : null;
}

export async function deleteUser(userId) {
    const { rowCount } = await sqlQuery("DELETE FROM users WHERE user_id = $1", [userId]);
    return rowCount > 0;
}

export async function listCategories() {
    const { rows } = await sqlQuery("SELECT * FROM categories ORDER BY category_name ASC");
    return rows.map(mapCategory);
}

export async function getCategoryById(categoryId) {
    const { rows } = await sqlQuery("SELECT * FROM categories WHERE category_id = $1", [categoryId]);
    return rows[0] ? mapCategory(rows[0]) : null;
}

export async function createCategory({ categoryName }) {
    const { rows } = await sqlQuery(
        `INSERT INTO categories(category_name)
         VALUES ($1)
         RETURNING *`,
        [categoryName]
    );
    return mapCategory(rows[0]);
}

export async function updateCategory(categoryId, { categoryName }) {
    const { rows } = await sqlQuery(
        `UPDATE categories
         SET category_name = COALESCE($2, category_name)
         WHERE category_id = $1
         RETURNING *`,
        [categoryId, categoryName ?? null]
    );
    return rows[0] ? mapCategory(rows[0]) : null;
}

export async function deleteCategory(categoryId) {
    const { rowCount } = await sqlQuery("DELETE FROM categories WHERE category_id = $1", [categoryId]);
    return rowCount > 0;
}

export async function listComponents() {
    const { rows } = await sqlQuery(
        `SELECT c.*, cat.category_name, u.name AS user_name, u.email
         FROM components c
         JOIN categories cat ON cat.category_id = c.category_id
         JOIN users u ON u.user_id = c.user_id
         ORDER BY c.component_id ASC`
    );
    return rows.map(mapComponent);
}

export async function getComponentById(componentId) {
    const { rows } = await sqlQuery(
        `SELECT c.*, cat.category_name, u.name AS user_name, u.email
         FROM components c
         JOIN categories cat ON cat.category_id = c.category_id
         JOIN users u ON u.user_id = c.user_id
         WHERE c.component_id = $1`,
        [componentId]
    );
    return rows[0] ? mapComponent(rows[0]) : null;
}

export async function createComponent({ name, description, categoryId, userId }) {
    const { rows } = await sqlQuery(
        `INSERT INTO components(name, description, category_id, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, description, categoryId, userId]
    );
    return getComponentById(rows[0].component_id);
}

export async function updateComponent(componentId, { name, description, categoryId, userId }) {
    const { rows } = await sqlQuery(
        `UPDATE components
         SET name = COALESCE($2, name),
             description = COALESCE($3, description),
             category_id = COALESCE($4, category_id),
             user_id = COALESCE($5, user_id),
             updated_at = NOW()
         WHERE component_id = $1
         RETURNING component_id`,
        [componentId, name ?? null, description ?? null, categoryId ?? null, userId ?? null]
    );

    if (!rows[0]) {
        return null;
    }

    return getComponentById(rows[0].component_id);
}

export async function deleteComponent(componentId) {
    const { rowCount } = await sqlQuery("DELETE FROM components WHERE component_id = $1", [componentId]);
    return rowCount > 0;
}
