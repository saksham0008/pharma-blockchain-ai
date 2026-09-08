/**
 * DrugManagementPage.js
 * Extracted from the original App.js — all logic preserved exactly.
 *
 * Contains:
 *  • Create Drug form
 *  • Get Drug form
 *  • QR code generation + download
 *  • QR scanner (html5-qrcode)
 *  • Drug info display with risk scoring
 *  • Session stats dashboard
 *  • Dark mode toggle
 *
 * API calls now use the centralized `api` instance so the backend URL
 * is read from REACT_APP_API_URL and authenticated requests automatically
 * include the JWT Authorization header.
 *
 * The original hardcoded URL (https://pharma-backend-foox.onrender.com)
 * has been replaced with relative paths that the Axios baseURL resolves.
 * Set REACT_APP_API_URL=https://pharma-backend-foox.onrender.com in
 * .env.local to restore the original deployed-backend behaviour.
 */

import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../services/api";

function DrugManagementPage() {
  const [drugID,     setDrugID]     = useState("");
  const [name,       setName]       = useState("");
  const [batch,      setBatch]      = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [result,     setResult]     = useState(null);
  const [qr,         setQr]         = useState("");
  const [scannerOn,  setScannerOn]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [darkMode,   setDarkMode]   = useState(false);

  // 📊 Dashboard state
  const [stats, setStats] = useState({
    total:   0,
    expired: 0,
    safe:    0,
  });

  const createDrug = async () => {
    if (!expiry) {
      alert("Please select expiry date");
      return;
    }

    const [year, month, day] = expiry.split("-");
    const expiryTimestamp = Math.floor(
      new Date(year, month - 1, day).getTime() / 1000
    );

    try {
      setLoading(true);
      await api.post("/createDrug", {
        drugID,
        name,
        batch,
        expiry: expiryTimestamp,
      });
      alert("✅ Drug Created!");
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  const getDrug = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/getDrug/${drugID}`);
      setResult(res.data);
      updateStats(res.data);
    } catch {
      alert("❌ Drug not found");
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/generateQR/${drugID}`);
      setQr(res.data.qr);
    } catch {
      alert("Error generating QR");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qr;
    link.download = "drugQR.png";
    link.click();
  };

  const getDrugFromScan = async (id) => {
    try {
      const res = await api.get(`/getDrug/${id}`);
      setResult(res.data);
      updateStats(res.data);
    } catch {
      alert("Drug not found");
    }
  };

  const getStatus = () => {
    if (!result) return "";
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime  = Number(result.expiryDate);
    const risk        = Number(result.riskScore);
    if (expiryTime < currentTime) return "EXPIRED";
    if (risk > 50)                return "HIGH RISK";
    return "AUTHENTIC";
  };

  const getStatusColor = () => {
    const status = getStatus();
    if (status === "AUTHENTIC") return "green";
    if (status === "EXPIRED")   return "orange";
    return "red";
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toDateString();
  };

  const updateStats = (data) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const exp         = Number(data.expiryDate);
    setStats((prev) => ({
      total:   prev.total + 1,
      expired: exp < currentTime ? prev.expired + 1 : prev.expired,
      safe:    exp >= currentTime ? prev.safe + 1    : prev.safe,
    }));
  };

  useEffect(() => {
    let scanner;

    if (scannerOn) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render(
        (decodedText) => {
          const id = decodedText.split("/").pop();
          setDrugID(id);
          getDrugFromScan(id);
          scanner.clear();
          setScannerOn(false);
        },
        () => {}
      );
    }

    return () => {
      if (scanner) scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOn]);

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      <h1 style={{ marginBottom: "10px" }}>💊 Pharma Blockchain System</h1>
      <p style={{ opacity: 0.7 }}>
        Secure Drug Verification using Blockchain &amp; QR
      </p>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {loading && <p>⏳ Loading...</p>}

      {/* 📊 Dashboard */}
      <div className="card">
        <h3>📊 Dashboard</h3>
        <p>Total Checked: {stats.total}</p>
        <p>Safe Drugs: {stats.safe}</p>
        <p>Expired Drugs: {stats.expired}</p>
      </div>

      <div className="card">
        <h3>🧾 Create Drug</h3>
        <input
          placeholder="Drug ID"
          onChange={(e) => setDrugID(e.target.value)}
        />
        <input
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Batch"
          onChange={(e) => setBatch(e.target.value)}
        />
        <input
          type="date"
          onChange={(e) => setExpiry(e.target.value)}
        />
        <button onClick={createDrug}>Create Drug</button>
      </div>

      <div className="card">
        <h3>🔍 Get Drug</h3>
        <input
          placeholder="Drug ID"
          onChange={(e) => setDrugID(e.target.value)}
        />
        <button onClick={getDrug}>Get Drug</button>
        <button onClick={generateQR}>Generate QR</button>
        <button onClick={() => setScannerOn(true)}>📷 Scan QR</button>
        {scannerOn && (
          <div id="reader" style={{ width: "300px", margin: "auto" }} />
        )}
      </div>

      {qr && (
        <div className="card">
          <h3>📱 QR Code</h3>
          <img src={qr} alt="QR" />
          <br />
          <button onClick={downloadQR}>⬇️ Download QR</button>
        </div>
      )}

      {result && (
        <div className="card">
          <h3>📦 Drug Info</h3>
          <p><b>ID:</b> {result.drugID}</p>
          <p><b>Name:</b> {result.name}</p>
          <p><b>Batch:</b> {result.batchNumber}</p>
          <p><b>Owner:</b> {result.currentOwner}</p>
          <p><b>Expiry:</b> {formatDate(result.expiryDate)}</p>
          <p><b>Risk Score:</b> {result.riskScore}</p>
          <p>
            <b>Status:</b>{" "}
            <span
              className={`status ${getStatus().toLowerCase().replace(" ", "-")}`}
              style={{ color: getStatusColor() }}
            >
              {getStatus()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default DrugManagementPage;
