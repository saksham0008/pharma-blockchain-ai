import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";

export default function ManufacturerDashboard() {
  const { darkMode } = useTheme();

  // ── Register Drug ─────────────────────────────────────────────
  const [drugID, setDrugID] = useState("");
  const [name, setName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturerName, setManufacturerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── Drug Lookup ───────────────────────────────────────────────
  const [lookupDrugID, setLookupDrugID] = useState("");
  const [drug, setDrug] = useState(null);

  // ── QR Code ───────────────────────────────────────────────────
  const [qrDrugID, setQrDrugID] = useState("");
  const [qrData, setQrData] = useState(null);

  // ── Transfer History ──────────────────────────────────────────
  const [historyDrugID, setHistoryDrugID] = useState("");
  const [history, setHistory] = useState([]);

  // ── General states ────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  // ── Register Drug ─────────────────────────────────────────────
  const handleRegisterDrug = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!expiryDate) {
      setError("Please select an expiry date.");
      return;
    }

    const expiryTimestamp = Math.floor(
      new Date(`${expiryDate}T00:00:00`).getTime() / 1000
    );

    try {
      setLoading(true);

      const res = await api.post("/api/drugs", {
        drugID,
        name,
        batchNumber,
        expiryTimestamp,
        manufacturerName,
        contactEmail,
      });

      setSuccess(
        `Drug registered successfully! Transaction Hash: ${res.data.txHash}`
      );

      // Clear form
      setDrugID("");
      setName("");
      setBatchNumber("");
      setExpiryDate("");
      setManufacturerName("");
      setContactEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Lookup Drug ───────────────────────────────────────────────
  const handleLookupDrug = async () => {
    clearMessages();
    setDrug(null);

    if (!lookupDrugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/api/drugs/${lookupDrugID.trim()}`
      );

      setDrug(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Generate QR ───────────────────────────────────────────────
  const handleGenerateQR = async () => {
    clearMessages();
    setQrData(null);

    if (!qrDrugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/api/generateQR/${qrDrugID.trim()}`
      );

      setQrData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData?.qr) return;

    const link = document.createElement("a");
    link.href = qrData.qr;
    link.download = "drugQR.png";
    link.click();
  };

  // ── Transfer History ──────────────────────────────────────────
  const handleViewHistory = async () => {
    clearMessages();
    setHistory([]);

    if (!historyDrugID.trim()) {
      setError("Please enter a Drug ID.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/api/drugs/${historyDrugID.trim()}/history`
      );

      setHistory(res.data.transferHistory || []);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    return new Date(
      Number(timestamp) * 1000
    ).toLocaleDateString();
  };

  return (
    <div className={darkMode ? "container dark" : "container"}>
      <h1>🏭 Manufacturer Dashboard</h1>
      <p>Manage drug registration, QR codes, and supply-chain history.</p>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading && (
        <div className="card">
          <LoadingSpinner
            size="medium"
            message="Processing blockchain transaction..."
          />
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────── */}
      {success && (
        <div
          style={{
            background: "#d1e7dd",
            color: "#0f5132",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            wordBreak: "break-word",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#842029",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION A — REGISTER DRUG
      ═══════════════════════════════════════════════════════════ */}
      <section className="card">
        <h2>🧾 Register Drug</h2>

        <form onSubmit={handleRegisterDrug}>
          <div>
            <label htmlFor="drugID">
              Drug ID
            </label>

            <input
              id="drugID"
              type="text"
              value={drugID}
              onChange={(e) => setDrugID(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="name">
              Drug Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="batchNumber">
              Batch Number
            </label>

            <input
              id="batchNumber"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="expiryDate">
              Expiry Date
            </label>

            <input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="manufacturerName">
              Manufacturer Name
            </label>

            <input
              id="manufacturerName"
              type="text"
              value={manufacturerName}
              onChange={(e) =>
                setManufacturerName(e.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="contactEmail">
              Contact Email
            </label>

            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) =>
                setContactEmail(e.target.value)
              }
            />
          </div>

          <button type="submit" disabled={loading}>
            Register Drug
          </button>
        </form>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION B — MY DRUGS
      ═══════════════════════════════════════════════════════════ */}
      <section className="card">
        <h2>📦 My Drugs</h2>

        <label htmlFor="lookupDrugID">
          Drug ID
        </label>

        <input
          id="lookupDrugID"
          type="text"
          value={lookupDrugID}
          onChange={(e) =>
            setLookupDrugID(e.target.value)
          }
        />

        <button
          type="button"
          onClick={handleLookupDrug}
          disabled={loading}
        >
          Look Up Drug
        </button>

        {drug && (
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th>Drug ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Expiry</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{drug.drugID}</td>
                  <td>{drug.name}</td>
                  <td>{drug.status}</td>
                  <td>{drug.riskScore}</td>
                  <td>{formatDate(drug.expiryDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION C — QR CODE
      ═══════════════════════════════════════════════════════════ */}
      <section className="card">
        <h2>📱 Generate QR Code</h2>

        <label htmlFor="qrDrugID">
          Drug ID
        </label>

        <input
          id="qrDrugID"
          type="text"
          value={qrDrugID}
          onChange={(e) =>
            setQrDrugID(e.target.value)
          }
        />

        <button
          type="button"
          onClick={handleGenerateQR}
          disabled={loading}
        >
          Generate QR
        </button>
      </section>

      {/* QR Modal/Card */}
      {qrData && (
        <div
          className="card"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            maxWidth: "400px",
            width: "90%",
            textAlign: "center",
          }}
        >
          <h2>Drug QR Code</h2>

          <img
            src={qrData.qr}
            alt="Drug verification QR code"
            style={{
              width: "250px",
              maxWidth: "100%",
            }}
          />

          <p
            style={{
              fontSize: "12px",
              wordBreak: "break-all",
            }}
          >
            {qrData.verifyURL}
          </p>

          <button type="button" onClick={downloadQR}>
            Download QR
          </button>

          <button
            type="button"
            onClick={() => setQrData(null)}
          >
            Close
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION D — TRANSFER HISTORY
      ═══════════════════════════════════════════════════════════ */}
      <section className="card">
        <h2>📜 Transfer History</h2>

        <label htmlFor="historyDrugID">
          Drug ID
        </label>

        <input
          id="historyDrugID"
          type="text"
          value={historyDrugID}
          onChange={(e) =>
            setHistoryDrugID(e.target.value)
          }
        />

        <button
          type="button"
          onClick={handleViewHistory}
          disabled={loading}
        >
          View History
        </button>

        {history.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            {history.map((item) => (
              <div
                key={item.index}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <strong>
                  Transfer #{Number(item.index) + 1}
                </strong>

                <p>
                  {item.from} → {item.to}
                </p>

                <p>
                  {new Date(
                    item.timestamp
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}