const express = require("express");
const contractService = require("../services/contractService");
const cacheService = require("../services/cacheService");
const { requireAuth, roleGuard } = require("../middleware/auth");
const User = require("../models/User");
const GpsLog = require("../models/GpsLog");

const router = express.Router();

// Helper: derive RiskCategory from score
function getRiskCategory(score) {
  if (score === 0) return "Uncolored";
  if (score <= 24) return "Low";
  if (score <= 49) return "Medium";
  if (score <= 74) return "High";
  return "Critical";
}

// Helper: convert Unix timestamp to ISO string
function toISO(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString();
}

// ── Task 8.1: POST /api/drugs — register drug on-chain + store metadata ───────
router.post("/", requireAuth, roleGuard("Manufacturer"), async (req, res) => {
  try {
    const { drugID, name, batchNumber, expiryTimestamp, manufacturerName, contactEmail } = req.body;

    if (!drugID || !name || !batchNumber || !expiryTimestamp) {
      return res.status(400).json({ error: "drugID, name, batchNumber, and expiryTimestamp are required" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(expiryTimestamp) <= now) {
      return res.status(400).json({ error: "expiryTimestamp must be a future date", code: "PAST_EXPIRY" });
    }

    const { txHash } = await contractService.createDrug(drugID, name, batchNumber, expiryTimestamp);

    // Store off-chain metadata
    try {
      await User.findOneAndUpdate(
        { walletAddress: req.user.walletAddress },
        {
          walletAddress: req.user.walletAddress,
          role: req.user.role,
          displayName: manufacturerName || "",
          contactEmail: contactEmail || ""
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error("Metadata store error (non-fatal):", dbErr.message);
    }

    res.status(201).json({ success: true, txHash, drugID });

  } catch (err) {
    console.error("POST /api/drugs error:", err);
    const errMsg = err.reason || err.message || "Failed to create drug";
    res.status(500).json({ error: errMsg });
  }
});

// ── Task 8.2: GET /api/drugs/:id — cached drug detail ─────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await cacheService.get(id);
    if (cached) return res.json(cached);

    // Cache miss — fetch from chain
    const drug = await contractService.getDrug(id);
    const status = await contractService.getDrugStatus(id);

    const response = {
      ...drug,
      status,
      riskCategory: getRiskCategory(drug.riskScore),
      expiryDateFormatted: toISO(drug.expiryDate)
    };

    await cacheService.set(id, response);
    res.json(response);

  } catch (err) {
    const msg = err.reason || err.message || "";
    if (msg.includes("Drug not found")) return res.status(404).json({ error: "Drug not found" });
    console.error("GET /api/drugs/:id error:", err);
    res.status(500).json({ error: msg || "Failed to fetch drug" });
  }
});

// ── Task 8.3: GET /api/drugs/:id/history — full formatted transfer history ────
router.get("/:id/history", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const drug = await contractService.getDrug(id);
    const status = await contractService.getDrugStatus(id);
    const history = await contractService.getTransferHistory(id);

    // Enrich each event with role labels and GPS location name
    const enrichedHistory = await Promise.all(history.map(async (ev) => {
      let fromRole = "Unknown", toRole = "Unknown";
      try {
        const fromRoleInfo = await contractService.getRoleOf(ev.from);
        const toRoleInfo = await contractService.getRoleOf(ev.to);
        fromRole = fromRoleInfo.name;
        toRole = toRoleInfo.name;
      } catch {}

      // Try to get location name from GPS logs
      let locationName = null;
      try {
        const gpsEntry = await GpsLog.findOne({ drugID: id, transferIndex: ev.index });
        locationName = gpsEntry?.locationName || null;
      } catch {}

      return {
        index: ev.index,
        from: ev.from,
        fromRole,
        to: ev.to,
        toRole,
        timestamp: toISO(ev.timestamp),
        lat: ev.lat,
        lng: ev.lng,
        locationName
      };
    }));

    const recallNotice = drug.recalled ? { recalled: true, drugID: id } : null;

    res.json({
      drugID: id,
      status,
      riskScore: drug.riskScore,
      riskCategory: getRiskCategory(drug.riskScore),
      recallNotice,
      transferHistory: enrichedHistory
    });

  } catch (err) {
    const msg = err.reason || err.message || "";
    if (msg.includes("Drug not found")) return res.status(404).json({ error: "Drug not found" });
    console.error("GET /api/drugs/:id/history error:", err);
    res.status(500).json({ error: msg || "Failed to fetch history" });
  }
});

// ── Task 8.5: GET /api/drugs/:id/status ───────────────────────────────────────
router.get("/:id/status", requireAuth, async (req, res) => {
  try {
    const status = await contractService.getDrugStatus(req.params.id);
    res.json({ drugID: req.params.id, status });
  } catch (err) {
    const msg = err.reason || err.message || "";
    if (msg.includes("Drug not found")) return res.status(404).json({ error: "Drug not found" });
    res.status(500).json({ error: msg });
  }
});

// ── Task 8.6: GET /api/drugs/:id/gps — ordered GPS log entries ───────────────
router.get("/:id/gps", requireAuth, async (req, res) => {
  try {
    const gpsLogs = await GpsLog.find({ drugID: req.params.id })
      .sort({ transferIndex: 1 })
      .lean();
    res.json({ drugID: req.params.id, gpsPath: gpsLogs });
  } catch (err) {
    console.error("GET /api/drugs/:id/gps error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
