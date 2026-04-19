import { Toaster } from "@/components/feedback/Toaster";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";
import DeveloperRoute from "@/components/common/DeveloperRoute";
import loadingIcon from "@/assets/showcase/loading.svg";
import { Suspense, lazy } from "react";
import { BrowserRouter, Outlet, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const ComponentDetail = lazy(() => import("./pages/ComponentDetails"));
const ComponentCode = lazy(() => import("./pages/ComponentCode"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AddComponentPage = lazy(() => import("./pages/AddComponentPage"));
const DeveloperDashboard = lazy(() => import("./pages/DeveloperDashboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Discussions = lazy(() => import("./pages/Discussions"));
const SqlAdmin = lazy(() => import("./pages/SqlAdmin"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
