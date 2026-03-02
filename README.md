# Modular Component Showcase Application

React + Vite single-page application built for academic and production-ready frontend engineering practice under **FRONT END DEVELOPMENT FRAMEWORKS AND UI ENGINEERING (25CS1201E)**.

## 1) Project Overview

- Demonstrates reusable component architecture, state-driven rendering, routing, forms, accessibility, and deployment-ready setup.
- Built with React 18, React Router, and Vite.
- Designed as a clean, documentation-style SPA with minimal UI clutter.

## 2) Feature List Mapped to CO1–CO6

- **CO1 (Foundations):** Declarative rendering, component composition, unidirectional data flow, state-driven re-renders.
- **CO2 (JS Engineering):** ES modules, modular folders, async/await, service abstraction in `src/services/mockApi.js` with closure metadata + cache.
- **CO3 (Component Model):** Controlled forms (`Login`, `Register`), internal uncontrolled input via `useRef`, props-as-contract comments in reusable components.
- **CO4 (State + Async):** Lifted search/filter state, `useMemo` derived filtering, `useEffect` cleanup to prevent stale updates, cached async data fetch.
- **CO5 (Routing/Forms/A11y/Perf):** Dynamic route `/component/:id`, nested route `/component/:id/code`, protected route logic, validation flow, `React.memo`, semantic + labeled form controls.
- **CO6 (Build Readiness):** Vite production build, linting, and GitHub Pages deployment workflow.

## 3) Architecture

- `App.jsx` defines route graph and top-level guards.
- `Layout` composes shared shell: `Header` + page content + `Footer`.
- `data/components.data.js` is the data source for catalog rendering.
- `services/mockApi.js` abstracts component fetching with closure-based internals and in-memory caching.
- Toast state uses a centralized custom hook (`use-toast.js`) and Radix primitives.

## 4) Folder Structure

```text
src/
  components/
    CategoryFilter.jsx
    CodeBlock.jsx
    ComponentCard.jsx
    ErrorBoundary.jsx
    Footer.css
    Footer.jsx
    Header.css
    Header.jsx
    Layout.css
    Layout.jsx
    ProtectedRoute.jsx
    SearchBar.jsx
    ShowcaseComponents.css
    Toast.jsx
    Toaster.jsx
    toast.css
  context/
    ThemeContext.jsx
  data/
    components.data.js
  pages/
    Index.jsx
    ComponentDetails.jsx
    ComponentCode.jsx
    Login.jsx
    Register.jsx
    Contact.jsx
    Help.jsx
    Privacy.jsx
    Terms.jsx
    NotFound.jsx
  services/
    mockApi.js
  App.jsx
  main.jsx
  use-toast.js
  index.css
```

## 5) State Management Strategy

- Local component state via `useState`.
- Lifted state in `Index.jsx` for category + search controls.
- Derived state via `useMemo` for filtered component lists.
- Theme persistence via context + localStorage (`ThemeContext`).
- Toast state handled through an internal reducer-style hook pattern.

## 6) Performance Optimizations

- `React.memo` used on reusable components (`Header`, `Footer`, `ComponentCard`).
- `useMemo` reduces repeated filtering work.
- Stable keys used for all mapped lists.
- Vite production bundling performs dead code elimination/tree-shaking for ES modules by default.

## 7) Accessibility Compliance

- Semantic landmarks: `header`, `main`, `footer`, `nav`, `section`.
- Inputs have labels (including screen-reader-only labels where needed).
- Keyboard focus visibility with `:focus-visible` global outline.
- Escape key closes mobile menu.
- Clickable email/phone links in footer (`mailto:`, `tel:`).

## 8) Routing Architecture

- `/`
- `/component/:id`
- `/component/:id/code` (nested route example)
- `/contact`, `/help`, `/privacy`, `/terms`
- `/login`, `/register`
- `*` fallback (Not Found)

Protected-route simulation is implemented for the nested code route using `localStorage` auth token checks.

## 9) Theme Persistence

- Theme preference is saved in `localStorage`.
- `ThemeContext` applies selected theme using `data-theme` on the document root.
- Header toggle allows switching and persisted restore on refresh.

## 10) Deployment Instructions

```bash
npm install
npm run lint
npm run build
npm run preview
```

- Vite uses optimized production bundling in `npm run build`.
- Tree-shaking is active by default for unused ESM exports.
- Repository includes GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

## 11) Vite, Tree-Shaking, and Lighthouse Notes

- **Vite bundling:** Fast dev server with native ESM, Rollup-based optimized production build.
- **Tree-shaking:** Unused exported code paths are dropped during production bundling.
- **Lighthouse recommendation:** Run Lighthouse on deployed pages and target Core Web Vitals (`LCP`, `CLS`, `INP`) and accessibility score improvements.

## 12) Syllabus Alignment Summary

This project now aligns with CO1–CO6 through component-driven React architecture, modular JS engineering patterns, controlled/uncontrolled forms, lifted + derived state, asynchronous service abstraction with cleanup/caching, nested/protected routing, accessibility-first implementation, and production-grade lint/build/test readiness.

