/**
 * AuthContext.js
 * Global authentication state for PharmaChain AI.
 *
 * State: { wallet, role, token }
 *
 * Actions:
 *   login(token, role, wallet)  – save to state + localStorage
 *   logout()                    – clear state + localStorage + navigate /login
 *
 * Init: reads from localStorage to restore session immediately (no network call).
 * The LoginPage is responsible for the MetaMask → backend flow before calling login().
 *
 * localStorage keys: pharma_token | pharma_role | pharma_wallet
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// Role → route map (used by LoginPage redirect and ProtectedRoute)
export const ROLE_ROUTES = {
  Admin:        "/admin",
  Manufacturer: "/manufacturer",
  Distributor:  "/distributor",
  Pharmacy:     "/pharmacy",
  Consumer:     "/consumer",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise directly from localStorage — no async /auth/me call needed
  const [wallet, setWallet] = useState(
    () => localStorage.getItem("pharma_wallet") || ""
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("pharma_role") || ""
  );
  const [token, setToken] = useState(
    () => localStorage.getItem("pharma_token") || ""
  );

  const navigate = useNavigate();

  // Called by LoginPage after a successful backend response
  const login = useCallback((newToken, newRole, newWallet) => {
    localStorage.setItem("pharma_token", newToken);
    localStorage.setItem("pharma_role",  newRole);
    localStorage.setItem("pharma_wallet", newWallet);
    setToken(newToken);
    setRole(newRole);
    setWallet(newWallet);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pharma_token");
    localStorage.removeItem("pharma_role");
    localStorage.removeItem("pharma_wallet");
    setToken("");
    setRole("");
    setWallet("");
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ wallet, role, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
