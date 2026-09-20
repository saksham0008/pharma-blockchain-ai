/**
 * AdminDashboard.js
 * Admin dashboard — Route: /admin
 */

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";

export default function AdminDashboard() {
  const { wallet } = useAuth();
  const { darkMode } = useTheme();

  // Assign Role
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("0");

  // Recall Drug
  const [drugID, setDrugID] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // Assign Role
  // --------------------------------
  const handleAssignRole = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setWarning("");

    if (!address.trim()) {
      setError("Please enter a wallet address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/assignRole", {
        address: address.trim(),
        role: Number(role),
      });

      setMessage(
        `Role assigned successfully. Transaction Hash: ${
          response.data.txHash || "N/A"
        }`
      );

      setAddress("");
      setRole("0");
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // Recall Drug
  // --------------------------------
  const handleRecall = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setWarning("");

    if (!drugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to recall drug ${drugID.trim()}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/recall", {
        drugID: drugID.trim(),
      });

      setMessage(
        `Drug recalled successfully. Transaction Hash: ${
          response.data.txHash || "N/A"
        }`
      );

      setWarning(
        "Warning: This drug has been recalled and should not be distributed or dispensed."
      );

      setDrugID("");
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? "container dark" : "container"}>
      <h1>Admin Dashboard</h1>

      {/* =========================
          ADMIN WALLET
      ========================== */}
      <div className="card">
        <h2>Admin Information</h2>

        <p>
          <strong>Admin Wallet:</strong>{" "}
          {wallet || "Wallet not available"}
        </p>
      </div>

      {/* =========================
          ASSIGN ROLE
      ========================== */}
      <div className="card">
        <h2>Assign Role</h2>

        <form onSubmit={handleAssignRole}>
          <label htmlFor="address">
            Wallet Address
          </label>

          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
          />

          <label htmlFor="role">
            Select Role
          </label>

          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="0">None</option>
            <option value="1">Admin</option>
            <option value="2">Manufacturer</option>
            <option value="3">Distributor</option>
            <option value="4">Pharmacy</option>
            <option value="5">Consumer</option>
          </select>

          <button type="submit" disabled={loading}>
            Assign Role
          </button>
        </form>
      </div>

      {/* =========================
          RECALL DRUG
      ========================== */}
      <div className="card">
        <h2>Recall Drug</h2>

        <form onSubmit={handleRecall}>
          <label htmlFor="recallDrugID">
            Drug ID
          </label>

          <input
            id="recallDrugID"
            type="text"
            value={drugID}
            onChange={(e) => setDrugID(e.target.value)}
            placeholder="Enter Drug ID"
          />

          <button type="submit" disabled={loading}>
            Recall Drug
          </button>
        </form>
      </div>

      {/* =========================
          LOADING
      ========================== */}
      {loading && (
        <LoadingSpinner message="Processing transaction..." />
      )}

      {/* =========================
          SUCCESS
      ========================== */}
      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}

      {/* =========================
          WARNING
      ========================== */}
      {warning && (
        <p style={{ color: "#b36b00" }}>
          {warning}
        </p>
      )}

      {/* =========================
          ERROR
      ========================== */}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
}