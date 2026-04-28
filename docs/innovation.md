# Innovation Feature

## Describe UI -> Get Matching Components

This is the high-impact feature added for the final submission. A user describes a desired UI in plain language, and the application returns semantically related components.

## Why It Matters

- It is easy to demo live.
- It feels innovative rather than purely CRUD-based.
- It uses the existing vector search stack, so it adds visible value without destabilizing the system.
- It lets the evaluator see a direct bridge between natural language intent and reusable component assets.

## How It Works

1. The user types a UI description, such as “a compact onboarding form with validation and success feedback”.
2. The frontend sends the text to the semantic search endpoint.
3. The backend converts the query to an embedding.
4. Stored component embeddings are scored by similarity.
5. The top matches are returned and rendered in the homepage innovation panel.

## User Experience

The homepage now contains a dedicated panel with:

- a natural-language prompt box
- a search button
- ranked semantic matches
- a short explanation of why the feature is useful

Relevant files:

- [frontend/src/pages/Index.jsx](../frontend/src/pages/Index.jsx)
- [frontend/src/services/componentEngagementService.js](../frontend/src/services/componentEngagementService.js)
- [backend/src/routes/mongoRoutes.js](../backend/src/routes/mongoRoutes.js)

## Sample Prompts

- `auth form with email validation`
- `data table with filters and empty state`
- `toast-driven success feedback for a settings page`
- `navigation header for a dashboard`

## What To Say In The Viva

This feature demonstrates applied retrieval-augmented thinking: the system converts intent into recommendations, rather than forcing the user to manually browse the catalog.
