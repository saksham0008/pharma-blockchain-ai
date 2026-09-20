/**
 * DistributorDashboard.js
 * Distributor dashboard — Route: /distributor
 */

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";

const DistributorDashboard = () => {
  const { wallet } = useAuth();
  const { darkMode } = useTheme();

  // My Drugs
  const [drugID, setDrugID] = useState("");
  const [drug, setDrug] = useState(null);

  // Transfer
  const [recipientAddress, setRecipientAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // Lookup Drug
  // --------------------------------
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

      const response = await api.get(`/api/drugs/${drugID.trim()}`);

      setDrug(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // Transfer Drug
  // --------------------------------
  const handleTransfer = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Validate Drug ID
    if (!drugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    // Validate recipient address
    if (!recipientAddress.trim()) {
      setError("Please enter the recipient wallet address.");
      return;
    }

    // Validate latitude and longitude
    if (latitude === "" || longitude === "") {
      setError("Please enter latitude and longitude.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/transfer", {
        drugID: drugID.trim(),
        toAddress: recipientAddress.trim(),
        lat: lat,
        lng: lng,
      });

      setMessage(
        `Drug transferred successfully. New Risk Score: ${
          response.data.newRiskScore
        }, Risk Category: ${response.data.riskCategory}`
      );

      // Clear transfer fields
      setRecipientAddress("");
      setLatitude("");
      setLongitude("");
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
      <h1>Distributor Dashboard</h1>

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

        {drug && (
          <div>
            <h3>Drug Details</h3>

            <p>
              <strong>Drug ID:</strong>{" "}
              {drug.drugID || drug.id}
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
              {drug.expiryDate || "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* =========================
          TRANSFER DRUG
      ========================== */}
      <div className="card">
        <h2>Transfer Drug</h2>

        <form onSubmit={handleTransfer}>
          <label htmlFor="transferDrugID">
            Drug ID
          </label>

          <input
            id="transferDrugID"
            type="text"
            value={drugID}
            onChange={(e) => setDrugID(e.target.value)}
            placeholder="Enter Drug ID"
          />

          <label htmlFor="recipientAddress">
            Recipient Wallet Address
          </label>

          <input
            id="recipientAddress"
            type="text"
            value={recipientAddress}
            onChange={(e) =>
              setRecipientAddress(e.target.value)
            }
            placeholder="Enter recipient wallet address"
          />

          <label htmlFor="latitude">
            Latitude
          </label>

          <input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Example: 26.4499"
          />

          <label htmlFor="longitude">
            Longitude
          </label>

          <input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Example: 80.3319"
          />

          <button type="submit" disabled={loading}>
            Transfer Drug
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
          ERROR
      ========================== */}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default DistributorDashboard;