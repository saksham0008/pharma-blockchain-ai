const express = require("express");
const QRCode = require("qrcode");
const contractService = require("../services/contractService");
const cacheService = require("../services/cacheService");
const { requireAuth, roleGuard } = require("../middleware/auth");
const GpsLog = require("../models/GpsLog");
const User = require("../models/User");

const router = express.Router();

function getRiskCategory(score) {
  if (score === 0) return "Uncolored";
  if (score <= 24) return "Low";
  if (score <= 49) return "Medium";
  if (score <= 74) return "High";
  return "Critical";
}

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2,"0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

// ── Task 11.1: GET /api/generateQR/:drugID ────────────────────────────────────
// Manufacturer-only. Generates a QR code for a drug's verify URL.
router.get("/generateQR/:drugID", requireAuth, roleGuard("Manufacturer", "Admin"), async (req, res) => {
  try {
    const { drugID } = req.params;

    if (!process.env.BASE_URL) {
      return res.status(500).json({ error: "BASE_URL not configured in environment" });
    }

    // Verify the drug exists
    try {
      await contractService.getDrug(drugID);
    } catch (err) {
      if ((err.reason || err.message || "").includes("Drug not found")) {
        return res.status(404).json({ error: `Drug '${drugID}' not found on-chain`, code: "DRUG_NOT_FOUND" });
      }
      throw err;
    }

    const verifyURL = `${process.env.BASE_URL}/verify/${drugID}`;
    const qrDataURL = await QRCode.toDataURL(verifyURL);

    res.json({
      drugID,
      verifyURL,
      qr: qrDataURL  // base64 PNG data URL for frontend display + download
    });

  } catch (err) {
    console.error("GET /api/generateQR error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Task 11.3: GET /verify/:drugID — public verification (no auth required) ──
// Supports both JSON (Accept: application/json) and HTML responses.
router.get("/verify/:drugID", async (req, res) => {
  try {
    const { drugID } = req.params;
    const wantsJSON = req.headers.accept && req.headers.accept.includes("application/json");

    // Try cache
    let drugData = await cacheService.get(drugID);

    if (!drugData) {
      let drug, status, history, gpsLogs, manufacturerName;
      try {
        drug = await contractService.getDrug(drugID);
        status = await contractService.getDrugStatus(drugID);
        history = await contractService.getTransferHistory(drugID);
        gpsLogs = await GpsLog.find({ drugID }).sort({ transferIndex: 1 }).lean();
      } catch (err) {
        if ((err.reason || err.message || "").includes("Drug not found")) {
          if (wantsJSON) return res.status(404).json({ error: "Drug not found or may be counterfeit", found: false });
          return res.status(404).send(`<h1>&#10060; Drug Not Found</h1><p>Drug ID: <b>${drugID}</b> does not exist on-chain and may be counterfeit.</p>`);
        }
        throw err;
      }

      // Get manufacturer display name
      try {
        const mfgUser = await User.findOne({ walletAddress: drug.currentOwner.toLowerCase() }).lean();
        manufacturerName = mfgUser?.displayName || drug.currentOwner;
      } catch {
        manufacturerName = drug.currentOwner;
      }

      drugData = {
        drugID: drug.drugID,
        name: drug.name,
        batchNumber: drug.batchNumber,
        manufacturer: manufacturerName,
        expiryDate: formatDate(drug.expiryDate),
        expiryTimestamp: drug.expiryDate,
        status,
        riskScore: drug.riskScore,
        riskCategory: getRiskCategory(drug.riskScore),
        recalled: drug.recalled,
        recallNotice: drug.recalled ? { recalled: true, drugID } : null,
        transferHistory: history,
        gpsPath: gpsLogs,
        found: true
      };

      await cacheService.set(drugID, drugData);
    }

    if (wantsJSON) return res.json(drugData);

    // HTML response for browser/QR scan
    const statusColor = drugData.status === "Active" ? "green" : drugData.status === "Recalled" ? "red" : "orange";
    const recallBanner = drugData.recalled
      ? `<div style="background:red;color:white;padding:16px;margin-bottom:16px;border-radius:6px;font-size:18px;">&#9888;&#65039; RECALL NOTICE: This drug has been recalled. Do not use.</div>`
      : "";
    const riskColors = { Uncolored: "#888", Low: "green", Medium: "orange", High: "darkorange", Critical: "red" };
    const riskColor = riskColors[drugData.riskCategory] || "#888";

    res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Drug Verification &#8212; ${drugData.drugID}</title>
<style>body{font-family:sans-serif;max-width:600px;margin:32px auto;padding:0 16px}
.card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0}
.status{font-size:20px;font-weight:bold}</style>
</head>
<body>
${recallBanner}
<h1>&#128138; Drug Verification</h1>
<div class="card">
  <p><b>Drug ID:</b> ${drugData.drugID}</p>
  <p><b>Name:</b> ${drugData.name}</p>
  <p><b>Batch:</b> ${drugData.batchNumber}</p>
  <p><b>Manufacturer:</b> ${drugData.manufacturer}</p>
  <p><b>Expiry:</b> ${drugData.expiryDate}</p>
  <p><b>Status:</b> <span class="status" style="color:${statusColor}">${drugData.status}</span></p>
  <p><b>Risk Score:</b> <span style="color:${riskColor}">${drugData.riskScore} (${drugData.riskCategory})</span></p>
</div>
<div class="card">
  <h3>Transfer History (${drugData.transferHistory.length} events)</h3>
  ${drugData.transferHistory.length === 0 ? "<p>No transfers yet.</p>" :
    drugData.transferHistory.map(t => `<p>#${t.index}: ${t.from.slice(0,8)}... &#8594; ${t.to.slice(0,8)}... at (${t.lat},${t.lng})</p>`).join("")}
</div>
</body></html>`);

  } catch (err) {
    console.error("GET /verify error:", err);
    res.status(500).send(`<h1>&#10060; Verification Error</h1><p>${err.message}</p>`);
  }
});

module.exports = router;
