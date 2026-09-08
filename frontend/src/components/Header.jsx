/**
 * Header.jsx
 * Authenticated application header for PharmaChain AI.
 *
 * Displays:
 *   • Brand (💊 PharmChain AI)
 *   • Truncated wallet address — first 6 chars + "..." + last 4 chars
 *   • Role badge with role-specific colour
 *   • Theme toggle button (☀️ Light / 🌙 Dark)
 *   • Logout button
 *
 * Reads from AuthContext (wallet, role, logout) and ThemeContext (darkMode, toggleDarkMode).
 * Uses semantic <header> with ARIA labels throughout.
 */

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const ROLE_COLOURS = {
  Admin:        { bg: "#6f42c1", text: "#fff" },
  Manufacturer: { bg: "#0d6efd", text: "#fff" },
  Distributor:  { bg: "#fd7e14", text: "#fff" },
  Pharmacy:     { bg: "#198754", text: "#fff" },
  Consumer:     { bg: "#0dcaf0", text: "#000" },
};

function truncate(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header() {
  const { wallet, role, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const badge = ROLE_COLOURS[role] || { bg: "#6c757d", text: "#fff" };

  return (
    <header
      aria-label="Application header"
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 28px",
        height:         "58px",
        background:     darkMode
          ? "linear-gradient(90deg,#0f0f1a,#1a1a2e)"
          : "linear-gradient(90deg,#1a1a2e,#16213e)",
        boxShadow:  "0 2px 12px rgba(0,0,0,0.3)",
        position:   "sticky",
        top:        0,
        zIndex:     1000,
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div aria-label="PharmChain AI" style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <span aria-hidden="true" style={{ fontSize: "22px" }}>💊</span>
        <span style={{ color: "#4facfe", fontWeight: 700, fontSize: "19px", letterSpacing: "0.4px" }}>
          PharmChain AI
        </span>
      </div>

      {/* ── Right controls ────────────────────────────────────────── */}
      <nav aria-label="User controls" style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Wallet address */}
        {wallet && (
          <span
            title={wallet}
            aria-label={`Connected wallet: ${wallet}`}
            style={{
              color:        "#cdd4e0",
              fontSize:     "12px",
              fontFamily:   "monospace",
              background:   "rgba(255,255,255,0.08)",
              padding:      "4px 10px",
              borderRadius: "6px",
            }}
          >
            🔑 {truncate(wallet)}
          </span>
        )}

        {/* Role badge */}
        {role && (
          <span
            aria-label={`Role: ${role}`}
            style={{
              background:   badge.bg,
              color:        badge.text,
              fontSize:     "11px",
              fontWeight:   700,
              padding:      "4px 11px",
              borderRadius: "20px",
              letterSpacing:"0.3px",
            }}
          >
            {role}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={btnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          aria-label="Logout"
          style={{ ...btnStyle, background: "#dc3545" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#c82333")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#dc3545")}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

const btnStyle = {
  padding:      "6px 14px",
  border:       "none",
  borderRadius: "7px",
  background:   "rgba(255,255,255,0.12)",
  color:        "#fff",
  fontWeight:   600,
  fontSize:     "12px",
  cursor:       "pointer",
  transition:   "opacity 0.15s, background 0.15s",
};
