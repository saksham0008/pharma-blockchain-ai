require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const { issueToken, requireAuth } = require("../middleware/auth");
const contractService = require("../services/contractService");

const router = express.Router();

// Message freshness window: 5 minutes
const MESSAGE_FRESHNESS_MS = 5 * 60 * 1000;

/**
 * POST /auth/login
 * Body: { walletAddress, signature, message }
 * 
 * Flow:
 * 1. Check on-chain role — 403 if None
 * 2. Verify message freshness (must contain a timestamp within 5 minutes)
 * 3. Verify signature with ethers.verifyMessage
 * 4. Issue JWT with walletAddress + role
 */
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "walletAddress, signature, and message are required" });
    }

    // Step 1: Check on-chain role before signature verification
    let roleInfo;
    try {
      roleInfo = await contractService.getRoleOf(walletAddress);
    } catch (err) {
      // If contract is not configured, fall back to a dev mode
      console.warn("ContractService unavailable for login check:", err.message);
      roleInfo = { index: 0, name: "None" };
    }

    if (!roleInfo || roleInfo.index === 0 || roleInfo.name === "None") {
      return res.status(403).json({ error: "No role assigned to this wallet address", code: "NO_ROLE" });
    }

    // Step 2: Verify message freshness — message should contain a Unix timestamp
    // Expected format: "Login to PharmaChain at <timestamp>"
    const timestampMatch = message.match(/(\d{10,13})$/);
    if (timestampMatch) {
      const msgTimestamp = parseInt(timestampMatch[1]);
      // Normalise to milliseconds
      const msgTimeMs = msgTimestamp < 1e12 ? msgTimestamp * 1000 : msgTimestamp;
      if (Date.now() - msgTimeMs > MESSAGE_FRESHNESS_MS) {
        return res.status(401).json({ error: "Login message is expired. Please try again.", code: "MSG_EXPIRED" });
      }
    }

    // Step 3: Verify wallet signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      return res.status(401).json({ error: "Invalid signature", code: "INVALID_SIGNATURE" });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match wallet address", code: "SIGNATURE_MISMATCH" });
    }

    // Step 4: Issue JWT
    const token = issueToken(walletAddress, roleInfo.name);

    res.json({
      token,
      role: roleInfo.name,
      walletAddress: walletAddress.toLowerCase(),
      expiresIn: 28800  // 8 hours in seconds
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

/**
 * GET /auth/me
 * Returns decoded JWT claims (walletAddress + role).
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    walletAddress: req.user.walletAddress,
    role: req.user.role
  });
});

module.exports = router;
