const express = require("express");
const contractService = require("../services/contractService");
const cacheService = require("../services/cacheService");
const aiService = require("../services/aiService");
const wsService = require("../services/wsService");
const { requireAuth } = require("../middleware/auth");
const { validateGPS } = require("../middleware/validate");
const GpsLog = require("../models/GpsLog");

const router = express.Router();

function getRiskCategory(score) {
  if (score === 0) return "Uncolored";
  if (score <= 24) return "Low";
  if (score <= 49) return "Medium";
  if (score <= 74) return "High";
  return "Critical";
}

/**
 * POST /api/transfer
 * Body: { drugID, toAddress, lat, lng }
 * Requires JWT auth (any role that is current owner can transfer).
 *
 * Flow:
 * 1. Validate GPS coordinates (validateGPS middleware handles 400)
 * 2. Call contractService.transferDrug
 * 3. Store GPS log in MongoDB
 * 4. Invalidate drug cache
 * 5. Trigger AI scoring, update risk score on-chain if changed
 * 6. wsService.broadcast will be wired in task 14.3
 * 7. Return result
 */
router.post("/", requireAuth, validateGPS, async (req, res) => {
  try {
    const { drugID, toAddress } = req.body;
    const { lat, lng } = req.gps; // set by validateGPS middleware

    if (!drugID || !toAddress) {
      return res.status(400).json({ error: "drugID and toAddress are required", code: "MISSING_FIELDS" });
    }

    // On-chain transfer
    const { txHash, receipt } = await contractService.transferDrug(drugID, toAddress, lat, lng);

    // Get transfer index (count after this transfer - 1 = new index)
    let transferIndex = 0;
    try {
      transferIndex = await contractService.getTransferCount(drugID) - 1;
    } catch {
      // non-fatal — default to 0
    }

    // Store GPS log
    const roleInfo = await contractService.getRoleOf(req.user.walletAddress).catch(() => ({ name: "Unknown" }));
    await GpsLog.create({
      drugID,
      transferIndex,
      lat,
      lng,
      actorAddress: req.user.walletAddress,
      actorRole: roleInfo.name,
      locationName: null, // reverse geocoding not done server-side (optional enhancement)
      timestamp: new Date()
    });

    // Invalidate cache so next read is fresh
    await cacheService.invalidate(drugID);

    // Trigger AI scoring and update on-chain risk score
    let newRiskScore = 0;
    let riskCategory = "Uncolored";
    try {
      const drug = await contractService.getDrug(drugID);
      const history = await contractService.getTransferHistory(drugID);
      const gpsLogs = await GpsLog.find({ drugID }).sort({ transferIndex: 1 }).lean();

      // Only call aiService.score if the function exists (service may be a stub)
      if (typeof aiService.score === "function") {
        const scoreResult = await aiService.score({
          drugID,
          expiryTimestamp: drug.expiryDate,
          transferCount: history.length,
          transferTimestamps: history.map(h => h.timestamp),
          gpsCoordinates: gpsLogs.map(g => ({ lat: g.lat, lng: g.lng })),
          batchRecalled: drug.recalled,
          manufacturerReputation: 1.0
        });

        newRiskScore = scoreResult.score;
        riskCategory = scoreResult.category;

        // Update on-chain risk score if it changed (retry handled inside aiService)
        if (newRiskScore !== drug.riskScore) {
          if (typeof aiService.updateOnChainScore === "function") {
            await aiService.updateOnChainScore(drugID, newRiskScore);
          } else {
            // Fallback: call contractService directly without retry
            await contractService.updateRiskScore(drugID, newRiskScore).catch(err => {
              console.warn("updateRiskScore fallback failed (non-fatal):", err.message);
            });
          }
        }
      } else {
        // AI service not yet implemented — retain last known score from chain
        newRiskScore = drug.riskScore;
        riskCategory = getRiskCategory(newRiskScore);
      }
    } catch (aiErr) {
      console.warn("AI scoring failed (non-fatal):", aiErr.message);
      // Retain last known risk score — do not block the transfer response
      try {
        const drug = await contractService.getDrug(drugID);
        newRiskScore = drug.riskScore;
        riskCategory = getRiskCategory(newRiskScore);
      } catch {
        // Leave defaults (0 / "Uncolored")
      }
    }

    // Broadcast real-time update to WebSocket subscribers
    wsService.broadcast(drugID, {
      type: "transfer",
      drugID,
      newOwner: toAddress,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      riskScore: newRiskScore,
      riskCategory
    });

    res.json({
      success: true,
      txHash,
      drugID,
      newOwner: toAddress,
      newRiskScore,
      riskCategory
    });

  } catch (err) {
    const msg = err.reason || err.message || "";
    if (msg.includes("Drug not found")) {
      return res.status(404).json({ error: "Drug not found" });
    }
    if (msg.includes("Not owner")) {
      return res.status(403).json({ error: "You are not the current owner of this drug" });
    }
    if (msg.includes("Cannot transfer recalled")) {
      return res.status(400).json({ error: "Cannot transfer a recalled drug" });
    }
    console.error("POST /api/transfer error:", err);
    res.status(500).json({ error: msg || "Transfer failed" });
  }
});

module.exports = router;
