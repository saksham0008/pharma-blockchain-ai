const express = require("express");
const contractService = require("../services/contractService");
const cacheService = require("../services/cacheService");
const wsService = require("../services/wsService");
const { requireAuth, roleGuard } = require("../middleware/auth");

const router = express.Router();

// POST /admin/recall — Admin only
router.post("/recall", requireAuth, roleGuard("Admin"), async (req, res) => {
  try {
    const { drugID } = req.body;
    if (!drugID) return res.status(400).json({ error: "drugID is required", code: "MISSING_FIELDS" });

    const { txHash } = await contractService.recallDrug(drugID);
    await cacheService.invalidate(drugID);

    // Broadcast recall alert to WebSocket subscribers
    wsService.broadcast(drugID, {
      type: "recall",
      drugID,
      timestamp: new Date().toISOString()
    });

    // Set risk score to 100 (Critical) after recall
    try { await contractService.updateRiskScore(drugID, 100); } catch (e) { console.error("Risk score update failed:", e.message); }

    res.json({ success: true, txHash, drugID, message: "Drug recalled and marked Critical" });
  } catch (err) {
    const msg = err.reason || err.message || "";
    if (msg.includes("Drug not found")) return res.status(404).json({ error: "Drug not found" });
    if (msg.includes("Drug already recalled")) return res.status(409).json({ error: "Drug already recalled" });
    console.error("POST /admin/recall error:", err);
    res.status(500).json({ error: msg || "Failed to recall drug" });
  }
});

// POST /admin/assignRole — Admin only
// Role values: 0=None, 1=Admin, 2=Manufacturer, 3=Distributor, 4=Pharmacy, 5=Consumer
router.post("/assignRole", requireAuth, roleGuard("Admin"), async (req, res) => {
  try {
    const { address, role } = req.body;
    if (!address || role === undefined || role === null)
      return res.status(400).json({ error: "address and role are required", code: "MISSING_FIELDS" });

    const roleIndex = Number(role);
    if (isNaN(roleIndex) || roleIndex < 0 || roleIndex > 5)
      return res.status(400).json({ error: "role must be an integer 0-5", code: "INVALID_ROLE" });

    const { txHash } = await contractService.assignRole(address, roleIndex);
    res.json({ success: true, txHash, address, role: roleIndex, roleName: contractService.ROLE_NAMES[roleIndex] });
  } catch (err) {
    console.error("POST /admin/assignRole error:", err);
    res.status(500).json({ error: err.reason || err.message || "Failed to assign role" });
  }
});

module.exports = router;
