
/**
 * PharmacyDashboard.js
 * Pharmacy dashboard — Route: /pharmacy
 */

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";

export default function PharmacyDashboard() {
  const { wallet } = useAuth();
  const { darkMode } = useTheme();

  // Drug lookup
  const [drugID, setDrugID] = useState("");
  const [drug, setDrug] = useState(null);

  // Dispense
  const [consumerAddress, setConsumerAddress] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Lookup Drug
  // -----------------------------
  const handleLookup = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setDrug(null);

    if (!drugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/api/drugs/${drugID.trim()}`
      );

      setDrug(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Dispense Drug to Consumer
  // -----------------------------
  const handleDispense = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!drugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    if (!consumerAddress.trim()) {
      setError("Please enter the consumer wallet address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/transfer", {
        drugID: drugID.trim(),
        toAddress: consumerAddress.trim(),
        lat: 0,
        lng: 0,
      });

      setMessage(
        `Drug dispensed successfully. Transaction Hash: ${
          response.data.txHash || "N/A"
        }`
      );

      setConsumerAddress("");
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
      <h1>Pharmacy Dashboard</h1>

      {/* =========================
          MY DRUGS
      ========================== */}
      <div className="card">
        <h2>My Drugs</h2>

        <p>
          <strong>My Wallet:</strong>{" "}
          {wallet || "Wallet not available"}
        </p>

        <form onSubmit={handleLookup}>
          <label htmlFor="drugID">
            Drug ID
          </label>

          <input
            id="drugID"
            type="text"
            value={drugID}
            onChange={(e) => setDrugID(e.target.value)}
            placeholder="Enter Drug ID"
          />

          <button type="submit" disabled={loading}>
            Lookup Drug
          </button>
        </form>

        {/* Drug details */}
        {drug && (
          <div>
            <h3>Drug Details</h3>

            <p>
              <strong>Drug ID:</strong>{" "}
              {drug.drugID || drug.id || "N/A"}
            </p>

            <p>
              <strong>Name:</strong>{" "}
              {drug.name || "N/A"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {drug.status || "N/A"}
            </p>

            <p>
              <strong>Risk Score:</strong>{" "}
              {drug.riskScore ?? "N/A"}
            </p>

            <p>
              <strong>Expiry:</strong>{" "}
              {drug.expiryDateFormatted || "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* =========================
          DISPENSE TO CONSUMER
      ========================== */}
      <div className="card">
        <h2>Dispense to Consumer</h2>

        <form onSubmit={handleDispense}>
          <label htmlFor="dispenseDrugID">
            Drug ID
          </label>

          <input
            id="dispenseDrugID"
            type="text"
            value={drugID}
            onChange={(e) => setDrugID(e.target.value)}
            placeholder="Enter Drug ID"
          />

          <label htmlFor="consumerAddress">
            Consumer Wallet Address
          </label>

          <input
            id="consumerAddress"
            type="text"
            value={consumerAddress}
            onChange={(e) =>
              setConsumerAddress(e.target.value)
            }
            placeholder="Enter consumer wallet address"
          />

          <button type="submit" disabled={loading}>
            Dispense Drug
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
          SUCCESS MESSAGE
      ========================== */}
      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}

      {/* =========================
          ERROR MESSAGE
      ========================== */}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
}