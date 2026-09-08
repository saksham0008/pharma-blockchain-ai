/**
 * App.js
 * Application root for PharmaChain AI.
 *
 * Provider order (outermost → innermost):
 *   ThemeProvider → AuthProvider → BrowserRouter
 *
 * Route map:
 *   /login            → LoginPage              (public)
 *   /verify/:drugID   → PublicVerifyPage        (public — QR scan)
 *   /admin            → AdminDashboard          (Admin only)
 *   /manufacturer     → ManufacturerDashboard   (Manufacturer only)
 *   /distributor      → DistributorDashboard    (Distributor only)
 *   /pharmacy         → PharmacyDashboard       (Pharmacy only)
 *   /consumer         → ConsumerDashboard       (Consumer only)
 *   *                 → redirect /login
 *
 * Dashboard pages are lazy-loaded so teammates can add their components
 * without touching this file beyond the import line.
 */

import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { AuthProvider }            from "./contexts/AuthContext";
import ProtectedRoute              from "./components/ProtectedRoute.jsx";
import Header                      from "./components/Header.jsx";
import LoadingSpinner              from "./components/LoadingSpinner.jsx";

// Public pages — eager loaded (needed immediately)
import LoginPage      from "./pages/LoginPage.jsx";
import VerifyPage     from "./pages/VerifyPage";

// Dashboard pages — lazy loaded (teammates fill these in)
const AdminDashboard        = lazy(() => import("./pages/dashboards/AdminDashboard"));
const ManufacturerDashboard = lazy(() => import("./pages/dashboards/ManufacturerDashboard"));
const DistributorDashboard  = lazy(() => import("./pages/dashboards/DistributorDashboard"));
const PharmacyDashboard     = lazy(() => import("./pages/dashboards/PharmacyDashboard"));
const ConsumerDashboard     = lazy(() => import("./pages/dashboards/ConsumerDashboard"));

// Fallback shown while a lazy dashboard chunk loads
function PageLoader() {
  return (
    <div style={{
      height:         "80vh",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
    }}>
      <LoadingSpinner size="large" message="Loading…" />
    </div>
  );
}

// Layout wrapper: Header + page content, dark-mode class applied here
function AuthenticatedLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

// Inner app reads ThemeContext to apply dark class to root div
function ThemedApp() {
  const { darkMode } = useTheme();

  return (
    <div className={darkMode ? "dark" : ""} style={{ minHeight: "100vh" }}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Public ───────────────────────────────────────────── */}
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/verify/:drugID"  element={<VerifyPage />} />

              {/* ── Protected: role-specific dashboards ──────────────── */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="Admin">
                    <AuthenticatedLayout>
                      <AdminDashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer"
                element={
                  <ProtectedRoute role="Manufacturer">
                    <AuthenticatedLayout>
                      <ManufacturerDashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor"
                element={
                  <ProtectedRoute role="Distributor">
                    <AuthenticatedLayout>
                      <DistributorDashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute role="Pharmacy">
                    <AuthenticatedLayout>
                      <PharmacyDashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumer"
                element={
                  <ProtectedRoute role="Consumer">
                    <AuthenticatedLayout>
                      <ConsumerDashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* ── Catch-all ─────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

// Root: ThemeProvider wraps everything
export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
