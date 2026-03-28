
# Modular Component Showcase Application

A full-stack React + Js application for browsing, previewing, and contributing reusable UI components.

The project combines a built-in component gallery with cloud-saved custom components, so users can explore ready-made UI patterns while developers can add new components through authenticated workflows.

## Live Links

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- Backend API: https://modular-component-showcase-application.onrender.com/api
- Health Check: https://modular-component-showcase-application.onrender.com/health

## Features

- Browse reusable UI components by category
- Search and filter components from the homepage
- Save favorite components
- Open component detail pages with live previews
- View JSX and CSS for bundled showcase components
- Use interactive playground controls for supported demos
- Register, login, logout, and reset passwords
- Add custom components as a developer or admin
- Delete components as the owner or an admin
- Submit support tickets from the contact page
- Switch between light and dark themes
- Responsive layout with accessibility-focused navigation and feedback

## Built With

### Frontend
- React 18
- Vite
- React Router
- Radix Toast
- Lucide React
- React Syntax Highlighter

### Backend
- Express 5
- MongoDB / Mongoose
- JWT
- bcryptjs
- Nodemailer

### Security
- Cookie-based authentication
- CSRF protection
- CORS
- Helmet
- Rate limiting

### Deployment
- GitHub Pages for frontend
- Render for backend
- GitHub Actions for CI and Pages deployment

## Project Structure

```text
.
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ context/
│  ├─ data/
│  ├─ demos/
│  ├─ hooks/
│  ├─ pages/
│  ├─ services/
│  ├─ App.jsx
│  └─ main.jsx
├─ backend/
│  ├─ src/
│  │  ├─ controller/
│  │  ├─ middleware/
│  │  ├─ model/
│  │  ├─ routes/
│  │  └─ utils/
│  └─ tests/
├─ public/
├─ .github/workflows/
├─ package.json
├─ vite.config.js
└─ README.md
```

## How It Works

- The homepage shows a searchable and filterable gallery of reusable components.
- Built-in showcase components are loaded from local data.
- Custom components are fetched from the backend and merged into the gallery.
- Detail pages display previews, interactive demo controls, and code snippets.
- Authentication is required for protected actions like adding components.
- Favorites are synced to the backend for logged-in users and stored locally as a fallback.
- Support tickets are sent through the backend email API, with fallback behavior where needed.

## Local Development

### 1. Install dependencies

```bash
npm install
```

Root install also installs backend dependencies through `postinstall`.

### 2. Frontend environment

Create a root `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Backend environment

Create `backend/.env` with values like:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_ORIGINS=http://localhost:8080,http://localhost:5173
ALLOW_MEMORY_FALLBACK=true
SMTP_USER=your_email_user
SMTP_PASS=your_email_password
SMTP_FROM=your_email_address
```

### 4. Run the app

Backend:

```bash
npm run start
```

Frontend:

```bash
npm run dev
```

### Local URLs

- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## Available Scripts

- `npm run dev` - start the Vite frontend
- `npm run start` - start the Express backend
- `npm run build` - create a production frontend build
- `npm run preview` - preview the built frontend
- `npm run lint` - run ESLint
- `npm run test` - run backend tests
- `npm run test:ui` - run frontend tests
- `npm run test:all` - run backend and frontend tests

## API Overview

### Health
- `GET /health`

### Authentication
- `GET /api/auth/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`

### Components
- `GET /api/components`
- `GET /api/components/:id`
- `POST /api/components`
- `DELETE /api/components/:id`

### Users
- `GET /api/users/me`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites/:componentId`

### Support
- `POST /api/email/send`
- `GET /api/captcha/getcaptcha/:length`

## Deployment

- Pushing to `main` triggers the GitHub Actions workflow that builds and deploys the frontend to GitHub Pages.
- The backend is deployed separately on Render.
- The frontend is configured to work under the GitHub Pages base path:
  `/modular-component-showcase-application/`

## Highlights

This project demonstrates:

- component modularity
- controlled state and prop-driven UI
- route-based navigation
- protected frontend routes
- secure backend integration
- role-based permissions
- live interactive component demos
- production-style deployment workflow

## Author

Rushmanth Nalluri
```

