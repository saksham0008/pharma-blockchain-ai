/**
 * LoginPage.jsx
 * MetaMask wallet-based login for PharmaChain AI.
 *
 * Flow:
 *   Step 1 — eth_requestAccounts  → get walletAddress
 *   Step 2 — personal_sign        → get signature
 *   Step 3 — POST /auth/login     → receive { token, role, walletAddress }
 *   → call login(token, role, wallet) from AuthContext
 *   → navigate to "/" + role.toLowerCase()
 *
 * Error handling:
 *   MetaMask not installed  → static warning (button disabled)
 *   User rejected (4001)    → "You rejected the request."
 *   403                     → "This wallet has no role assigned. Contact admin."
 *   401                     → "Signature verification failed. Try again."
 *   Network / other         → generic message
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import LoadingSpinner from "../components/LoadingSpinner";

// Inject keyframes once
if (!document.getElementById("login-kf")) {
  const s = document.createElement("style");
  s.id = "login-kf";
  s.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

export default function LoginPage() {
  const { login, token, role } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [hasMetaMask,   setHasMetaMask]   = useState(true);

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (token && role) {
      navigate("/" + role.toLowerCase(), { replace: true });
    }
  }, [token, role, navigate]);

  useEffect(() => {
    setHasMetaMask(Boolean(window.ethereum));
  }, []);

  async function handleConnect() {
    setError("");
    setLoading(true);

    try {
      // ── Step 1: connect wallet ──────────────────────────────────────
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      } catch (err) {
        if (err.code === 4001) throw new Error("You rejected the request.");
        throw new Error("Could not connect to MetaMask. Please try again.");
      }

      const account = accounts[0];
      setWalletAddress(account);

      // ── Step 2: sign message ────────────────────────────────────────
      const message = "Login to PharmaChain at " + Date.now();
      let signature;
      try {
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, account],
        });
      } catch (err) {
        if (err.code === 4001) throw new Error("You rejected the request.");
        throw new Error("Failed to sign the login message. Please try again.");
      }

      // ── Step 3: authenticate with backend ──────────────────────────
      let res;
      try {
        res = await api.post("/auth/login", {
          walletAddress: account,
          signature,
          message,
        });
      } catch (err) {
        const status = err.response?.status;
        if (!err.response) {
          throw new Error(
            "Cannot reach the backend. Make sure it is running on port 4000."
          );
        }
        if (status === 403) {
          throw new Error(
            "This wallet has no role assigned. Contact admin."
          );
        }
        if (status === 401) {
          throw new Error("Signature verification failed. Try again.");
        }
        throw new Error(
          err.response?.data?.error || "Login failed. Please try again."
        );
      }

      const { token: newToken, role: newRole, walletAddress: returnedWallet } =
        res.data;

      // ── Save auth state and redirect ────────────────────────────────
      login(newToken, newRole, returnedWallet || account);
      navigate("/" + newRole.toLowerCase(), { replace: true });

    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Dark-mode aware palette ───────────────────────────────────────────────
  const bg      = darkMode ? "#0f0f1a"  : "linear-gradient(135deg,#eef2f7,#dbe6f6)";
  const cardBg  = darkMode ? "#1a1a2e"  : "#ffffff";
  const textCol = darkMode ? "#e2e8f0"  : "#1a1a2e";
  const subCol  = darkMode ? "#94a3b8"  : "#666";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex",
                  alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{
        background:   cardBg,
        borderRadius: "18px",
        boxShadow:    "0 10px 40px rgba(0,0,0,0.15)",
        padding:      "44px 38px",
        width:        "100%",
        maxWidth:     "420px",
        textAlign:    "center",
        animation:    "fadeUp 0.35s ease-out",
        fontFamily:   "'Segoe UI', Arial, sans-serif",
      }}>

        {/* Brand */}
        <div style={{ fontSize: "40px", marginBottom: "8px" }}>💊</div>
        <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, color: textCol }}>
          PharmChain AI
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: "13px", color: subCol }}>
          Anti-Counterfeit Drug Authentication
        </p>

        {/* MetaMask not installed */}
        {!hasMetaMask && (
          <div style={styles.warning}>
            ⚠️ MetaMask not detected. Please{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
               style={{ color: "#4facfe" }}>
              install MetaMask
            </a>{" "}
            and reload.
          </div>
        )}

        {/* Wallet connected indicator */}
        {walletAddress && !loading && (
          <div style={styles.walletBadge}>
            🔑 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" style={styles.error}>
            ❌ {error}
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div style={{ margin: "20px 0" }}>
            <LoadingSpinner size="medium" message="Connecting to MetaMask…" />
          </div>
        )}

        {/* Connect button */}
        {!loading && (
          <button
            onClick={handleConnect}
            disabled={!hasMetaMask}
            aria-label="Connect MetaMask and login"
            style={{
              ...styles.btn,
              opacity: hasMetaMask ? 1 : 0.5,
              cursor:  hasMetaMask ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (hasMetaMask)
                e.currentTarget.style.background =
                  "linear-gradient(135deg,#007bff,#0056b3)";
            }}
            onMouseLeave={(e) => {
              if (hasMetaMask)
                e.currentTarget.style.background =
                  "linear-gradient(135deg,#4facfe,#00f2fe)";
            }}
          >
            🦊 Connect &amp; Login with MetaMask
          </button>
        )}

        <p style={{ marginTop: "20px", fontSize: "11px", color: subCol }}>
          Secured by blockchain · Powered by Ethereum
        </p>
      </div>
    </div>
  );
}

const styles = {
  warning: {
    background:   "#fff8e1",
    border:       "1px solid #ffe082",
    borderRadius: "10px",
    padding:      "12px 14px",
    marginBottom: "16px",
    fontSize:     "13px",
    color:        "#5d4037",
    textAlign:    "left",
  },
  walletBadge: {
    display:      "inline-block",
    background:   "rgba(79,172,254,0.12)",
    border:       "1px solid rgba(79,172,254,0.3)",
    borderRadius: "20px",
    padding:      "5px 14px",
    fontSize:     "12px",
    fontFamily:   "monospace",
    color:        "#4facfe",
    marginBottom: "14px",
  },
  error: {
    background:   "#fff0f0",
    border:       "1px solid #f5c6cb",
    borderRadius: "10px",
    padding:      "12px 14px",
    marginBottom: "16px",
    fontSize:     "13px",
    color:        "#721c24",
    textAlign:    "left",
  },
  btn: {
    display:      "block",
    width:        "100%",
    padding:      "14px",
    border:       "none",
    borderRadius: "10px",
    background:   "linear-gradient(135deg,#4facfe,#00f2fe)",
    color:        "#fff",
    fontWeight:   700,
    fontSize:     "15px",
    transition:   "background 0.2s",
  },
};
