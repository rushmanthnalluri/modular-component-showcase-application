# Relational Mapping and Normalization Proof

## Mapping Process
1. Identify entities and candidate keys.
2. Convert `M:N` relationships into associative tables.
3. separate lookup entities such as `categories`.
4. enforce functional dependencies with `PRIMARY KEY`, `UNIQUE`, and `FOREIGN KEY`.
5. add supporting indexes only after the normalized design is stable.

## Unnormalized Starting Point
An unnormalized component row could look like:
`(component_name, category_name, author_name, author_email, review_1, review_2, ...)`

Problems:
- repeating groups
- update anomalies
- delete anomalies
- insertion anomalies

## 1NF Proof
- attributes are atomic in `users`, `components`, `reviews`, `ratings`
- no repeating columns such as `review_1`, `review_2`
- favorites are not stored as repeating relational columns; they are separated into `user_favorites`

## 2NF Proof
- base tables use surrogate primary keys
- non-key attributes in `components` depend on the full key `component_id`
- in `user_favorites`, the business uniqueness is the full pair `(user_id, component_mongo_id)` and no non-key column depends on only part of that pair

## 3NF Proof
- category name depends on `category_id`, not on `component_id`
- user profile fields depend on `user_id`, not on component or review rows
- review text depends on `review_id`, not on user email or category name

## BCNF Proof
BCNF requires every determinant to be a candidate key.
- `users.email -> users.*` is safe because `email` is unique and therefore a candidate key
- `categories.category_name -> categories.*` is safe because `category_name` is unique
- `user_favorites(user_id, component_mongo_id)` is safe because the pair is unique and determines the row

## Why JSONB Does Not Break the Proof
`social_links`, `stats`, and `email_preferences` are stored as JSONB for extensibility, but they are still attributes of the `users` entity and do not introduce relational transitive dependencies across tables.

## Drift Prevention
- Node schema bootstrap: `backend/src/sql/initSchema.js`
- Spring Flyway migrations: `spring-service/src/main/resources/db/migration`
- CI and documentation: contracts, SQL files, and deployment workflows are versioned together
