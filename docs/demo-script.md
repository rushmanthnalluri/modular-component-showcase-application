# Demo Script

Use this script during the viva or presentation.

## 1. Open The App

- Start on the React homepage.
- Point out the component catalog, search bar, and category filters.

## 2. Register Or Login

- Create a new account or sign in with an existing one.
- Mention that authentication is JWT-based with browser-safe cookie handling.

## 3. Browse Components

- Open a few component cards.
- Explain that the catalog is split into reusable UI modules with metadata, tags, ratings, and reviews.

## 4. Run Vector Search

- Type a multi-word query such as `form validation`.
- Show that semantically related components appear even if the wording is not exact.

## 5. Add A Component

- Add or edit a component entry.
- Mention the structured validation and persistence split across PostgreSQL and MongoDB.

## 6. Review And Rate

- Open a component and submit a rating or review.
- Emphasize that transactional data is stored in the relational layer.

## 7. Favorite A Component

- Toggle a favorite on one or two cards.
- Explain that the relationship is stored separately to avoid redundancy.

## 8. Show The Innovation Feature

- In the homepage innovation panel, enter a prompt such as:
  - `A compact onboarding form with validation and success feedback`
- Show the ranked matches.
- State that this is the main distinction feature for the final score.

## 9. Briefly Explain The Architecture

- Frontend -> FastAPI gateway -> Node.js backend -> PostgreSQL and MongoDB.
- Mention that the gateway provides security and observability while the backend performs the application logic.

## 10. Close With The Proof

- Mention the architecture, database, vector search, performance, security, and rubric docs.
- This turns the project from a working app into a well-evidenced academic submission.
