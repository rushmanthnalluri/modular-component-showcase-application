import { Toaster } from "@/components/feedback/Toaster";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";
import DeveloperRoute from "@/components/common/DeveloperRoute";
import loadingIcon from "@/assets/showcase/loading.svg";
import { Suspense, lazy } from "react";
import { BrowserRouter, Outlet, Routes, Route } from "react-router-dom";

const CHUNK_ERROR_RELOAD_KEY = "mcsa:chunk-reload-attempted";

function isChunkLoadError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module")
    || message.includes("failed to load module script")
    || message.includes("loading chunk")
  );
}

function lazyWithChunkRetry(importer) {
  return lazy(async () => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(CHUNK_ERROR_RELOAD_KEY);
      }
      return await importer();
    } catch (error) {
      if (typeof window !== "undefined" && window.sessionStorage && isChunkLoadError(error)) {
        const hasRetried = window.sessionStorage.getItem(CHUNK_ERROR_RELOAD_KEY) === "1";
        if (!hasRetried) {
          window.sessionStorage.setItem(CHUNK_ERROR_RELOAD_KEY, "1");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

const Index = lazyWithChunkRetry(() => import("./pages/Index"));
const ComponentDetail = lazyWithChunkRetry(() => import("./pages/ComponentDetails"));
const ComponentCode = lazyWithChunkRetry(() => import("./pages/ComponentCode"));
const Contact = lazyWithChunkRetry(() => import("./pages/Contact"));
const About = lazyWithChunkRetry(() => import("./pages/About"));
const Help = lazyWithChunkRetry(() => import("./pages/Help"));
const Login = lazyWithChunkRetry(() => import("./pages/Login"));
const Register = lazyWithChunkRetry(() => import("./pages/Register"));
const AddComponentPage = lazyWithChunkRetry(() => import("./pages/AddComponentPage"));
const DeveloperDashboard = lazyWithChunkRetry(() => import("./pages/DeveloperDashboard"));
const UserDashboard = lazyWithChunkRetry(() => import("./pages/UserDashboard"));
const Favorites = lazyWithChunkRetry(() => import("./pages/Favorites"));
const Reviews = lazyWithChunkRetry(() => import("./pages/Reviews"));
const Discussions = lazyWithChunkRetry(() => import("./pages/Discussions"));
const SqlAdmin = lazyWithChunkRetry(() => import("./pages/SqlAdmin"));
const Privacy = lazyWithChunkRetry(() => import("./pages/Privacy"));
const Terms = lazyWithChunkRetry(() => import("./pages/Terms"));
const NotFound = lazyWithChunkRetry(() => import("./pages/NotFound"));

function resolveRouterBasename() {
  if (typeof window === "undefined") {
    return import.meta.env.BASE_URL || "/";
  }

  const host = String(window.location.hostname || "").toLowerCase();

  // Render and local environments should always use root-based routing.
  if (host.endsWith(".onrender.com") || host === "localhost" || host === "127.0.0.1") {
    return "/";
  }

  // Keep repo subpath routing for GitHub Pages deployments.
  if (host.endsWith("github.io")) {
    return import.meta.env.BASE_URL || "/";
  }

  return "/";
}

function RouteFallback() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <img src={loadingIcon} alt="Loading" className="app-loading-logo" />
    </div>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <Toaster />
      <BrowserRouter
        basename={resolveRouterBasename()}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:categoryId" element={<Index />} />
            <Route path="/component/:id" element={<Outlet />}>
              <Route index element={<ComponentDetail />} />
              <Route
                path="code"
                element={(
                  <ProtectedRoute>
                    <ComponentCode />
                  </ProtectedRoute>
                )}
              />
            </Route>
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/favorites"
              element={(
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              )}
            />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route
              path="/admin/sql"
              element={(
                <ProtectedRoute>
                  <AdminRoute>
                    <SqlAdmin />
                  </AdminRoute>
                </ProtectedRoute>
              )}
            />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/add-component"
              element={(
                <ProtectedRoute>
                  <AddComponentPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/developer/dashboard"
              element={(
                <ProtectedRoute>
                  <DeveloperRoute>
                    <DeveloperDashboard />
                  </DeveloperRoute>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/user/dashboard"
              element={(
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
