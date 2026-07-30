const express = require("express");
const fabricService = require("../services/fabricService");
const { requireAuth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/drug/:id", requireAuth, roleGuard("Manufacturer", "Distributor"), async (req, res) => {
  try {
    if (!fabricService.FABRIC_ENABLED) {
      return res.status(503).json({
        error: "Hyperledger Fabric is not configured",
        hint: "Set FABRIC_CONNECTION_PROFILE and FABRIC_WALLET_PATH, then run docker-compose up in fabric/",
        fabricEnabled: false
      });
    }
    const data = await fabricService.getDrugPrivate(req.params.id);
    res.json({ drugID: req.params.id, fabricData: data });
  } catch (err) {
    const msg = err.message || "";
    if (msg.includes("ACCESS_DENIED")) return res.status(403).json({ error: "Access denied to private data" });
    if (msg.includes("not found")) return res.status(404).json({ error: "Drug not found on Fabric" });
    if (msg.includes("FABRIC_UNAVAILABLE")) return res.status(503).json({ error: msg });
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
