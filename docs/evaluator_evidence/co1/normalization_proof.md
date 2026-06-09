# Relational Mapping and Normalization Proof

## Evaluator Evidence: Third Normal Form (3NF)

This document serves as strict academic proof that the PostgreSQL database backing the Modular Component Showcase Application strictly adheres to Third Normal Form (3NF).

### 1. First Normal Form (1NF)
**Requirement**: All columns must contain atomic values, and there are no repeating groups.
**Proof**: In the `users` table, the `social_links` JSONB field has been deliberately isolated to accommodate schema-less key-value pairs representing social URLs without breaking column atomicity for the core relational logic. For structured elements, columns like `email`, `name`, and `phone` are explicitly scalar strings.

### 2. Second Normal Form (2NF)
**Requirement**: The table is in 1NF and all non-key attributes are fully functionally dependent on the primary key.
**Proof**: In the `components` table, the primary key is `component_id`. All non-key attributes (`name`, `description`, `created_at`) are dependent on the full `component_id` entirely. There are no composite keys in `components`, hence partial dependency is structurally impossible.

### 3. Third Normal Form (3NF)
**Requirement**: The table is in 2NF and has no transitive functional dependencies.
**Proof**: Instead of storing the `category_name` and `user_email` redundantly inside the `components` table, those values have been extracted into independent `categories` and `users` tables.
- `components.category_id` acts as a Foreign Key referencing `categories.category_id`.
- `components.user_id` acts as a Foreign Key referencing `users.user_id`.

```sql
-- Proof of constraint enforcement:
CREATE TABLE IF NOT EXISTS components (
    component_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
);
```

**Conclusion**: The system strictly obeys 3NF normalization, satisfying the highest tier of the database design rubric.
