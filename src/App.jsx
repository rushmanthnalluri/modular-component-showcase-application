import { Toaster } from "@/components/Toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { BrowserRouter, Outlet, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ComponentDetail from "./pages/ComponentDetails";
import ComponentCode from "./pages/ComponentCode";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <ErrorBoundary>
      <Toaster />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
