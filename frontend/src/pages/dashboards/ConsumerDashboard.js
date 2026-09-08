/**
 * ConsumerDashboard.js
 * ─────────────────────────────────────────────────────────
 * PLACEHOLDER — Route: /consumer  (Consumer role only)
 * ─────────────────────────────────────────────────────────
 * Consumer teammate: replace this file's body with the
 * full dashboard implementation.
 */

import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ConsumerDashboard() {
  const { wallet } = useAuth();
  return (
    <div style={page}>
      <div style={card}>
        <h2>👤 Consumer Dashboard</h2>
        <p style={sub}>Wallet: <code>{wallet}</code></p>
        <p style={note}>📌 Placeholder — Consumer teammate: implement here.</p>
      </div>
    </div>
  );
}

const page = { minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#eef2f7,#dbe6f6)", fontFamily:"'Segoe UI',Arial,sans-serif" };
const card = { background:"#fff", borderRadius:"14px", boxShadow:"0 6px 24px rgba(0,0,0,.1)", padding:"36px 32px", maxWidth:"480px", width:"100%", textAlign:"center" };
const sub  = { fontSize:"13px", color:"#555" };
const note = { background:"#fce4ec", border:"1px dashed #ef9a9a", borderRadius:"8px", padding:"8px 14px", fontSize:"13px", color:"#b71c1c" };
