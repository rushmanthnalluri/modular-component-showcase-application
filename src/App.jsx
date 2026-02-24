import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const ComponentDetail = lazy(() => import("./pages/ComponentDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const App = () => (
  <>
    <Toaster />
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense
        fallback={
          <div className="app-loading">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/component/:id" element={<ComponentDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </>
);
var stdin_default = App;
export { stdin_default as default };
