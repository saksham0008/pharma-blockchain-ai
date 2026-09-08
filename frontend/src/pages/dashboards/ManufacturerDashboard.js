/**
 * ManufacturerDashboard.js
 * ─────────────────────────────────────────────────────────
 * PLACEHOLDER — Route: /manufacturer  (Manufacturer role only)
 * ─────────────────────────────────────────────────────────
 * Manufacturer teammate: replace this file's body with the
 * full dashboard implementation.
 *
 * The original drug-management UI (Create Drug, Get Drug,
 * QR generation, scanner) lives in:
 *   src/pages/DrugManagementPage.js
 * Import and use it here as needed.
 */

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import DrugManagementPage from "../DrugManagementPage";

export default function ManufacturerDashboard() {
  const { wallet } = useAuth();
  return (
    <div>
      <div style={banner}>
        <h2 style={{ margin:"0 0 4px" }}>🏭 Manufacturer Dashboard</h2>
        <p style={{ margin:0, fontSize:"13px", color:"#555" }}>
          Wallet: <code>{wallet}</code>
        </p>
        <p style={note}>
          📌 Placeholder — Manufacturer teammate: replace this banner and
          integrate drug management below as required.
        </p>
      </div>
      <DrugManagementPage />
    </div>
  );
}

const banner = { background:"linear-gradient(135deg,#e3f0ff,#cce0ff)", borderBottom:"3px solid #4facfe", padding:"18px 28px", textAlign:"center", fontFamily:"'Segoe UI',Arial,sans-serif" };
const note   = { display:"inline-block", background:"#fff", border:"1px dashed #4facfe", borderRadius:"6px", padding:"5px 12px", fontSize:"12px", color:"#0056b3", marginTop:"8px" };
