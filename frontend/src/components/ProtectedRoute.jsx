/**
 * ProtectedRoute.jsx
 *
 * Props:
 *   role     – optional string. If provided, the authenticated user's role
 *              must match exactly or they are redirected to /login.
 *   children – the protected content
 *
 * Behaviour:
 *   No token           → <Navigate to="/login" replace>
 *   Wrong role         → <Navigate to="/login" replace>
 *   Authenticated      → render children
 *
 * Note: AuthContext initialises synchronously from localStorage, so there
 * is no async loading state to handle here.
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ role: requiredRole, children }) {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
