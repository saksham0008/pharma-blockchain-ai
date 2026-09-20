/**
 * Event Listener Service
 * Listens to blockchain events from PharmaSupplyChain.sol on Polygon Amoy testnet.
 * Uses ethers.js v6 to monitor contract events and persist them to MongoDB.
 *
 * Features:
 *   - Real-time event capture for 5 contract events
 *   - BigInt -> Number conversion for ethers v6 compatibility
 *   - GPS coordinate transformation (int256 * 1e6 -> float)
 *   - Webhook alerting for critical failures (uses built-in https, no extra dep)
 *   - Graceful error handling
 */

require("dotenv").config();
const { ethers } = require("ethers");
const https = require("https");
const http = require("http");
const EventLog = require("../models/EventLog");
const contractABI = require("../abi/PharmaSupplyChain.json").abi;

let provider = null;
let contract = null;

/**
 * Send alert to external webhook on critical failures.
 * Uses built-in https/http — no extra npm dependency needed.
 * @param {string} errorMessage
 * @param {object} context
 */
function sendAlert(errorMessage, context) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const body = JSON.stringify({
      service: "blockchain-event-listener",
      error: errorMessage,
      timestamp: new Date().toISOString(),
      context: context || {},
    });

    const parsed = new URL(webhookUrl);
    const transport = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + (parsed.search || ""),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = transport.request(options, function (res) {
      console.log("Alert webhook response:", res.statusCode);
    });
    req.on("error", function (err) {
      console.error("Alert webhook error:", err.message);
    });
    req.setTimeout(5000, function () {
      req.destroy();
    });
    req.write(body);
    req.end();
    console.log("Alert sent to webhook:", errorMessage);
  } catch (err) {
    console.error("Failed to send alert webhook:", err.message);
  }
}

/**
 * Start listening to blockchain events.
 * Connects to Polygon Amoy RPC and registers event handlers for all 5 events.
 */
function startListening() {
  if (!process.env.RPC_URL || !process.env.CONTRACT_ADDRESS) {
    console.warn(
      "EventListener: Missing RPC_URL or CONTRACT_ADDRESS -- skipping blockchain event listener"
    );
    return;
  }

  try {
    console.log("Initializing blockchain event listener...");

    // ethers.js v6: JsonRpcProvider (NOT ethers.providers.JsonRpcProvider)
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      provider
    );

    // -------------------------------------------------------------------------
    // DrugCreated(string drugID, address manufacturer)
    // -------------------------------------------------------------------------
    contract.on("DrugCreated", async function (drugID, manufacturer, event) {
      try {
        await EventLog.create({
          eventName: "DrugCreated",
          drugID: drugID,
          data: { manufacturer: manufacturer },
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
        });
        console.log("Event saved: DrugCreated", drugID);
      } catch (err) {
        console.error("EventLog save error (DrugCreated):", err.message);
      }
    });

    // -------------------------------------------------------------------------
    // DrugTransferred(string drugID, address from, address to,
    //                 int256 lat, int256 lng, uint256 timestamp)
    // GPS stored as int256 * 1e6 on-chain; divide by 1e6 for float value.
    // All BigInt args must be converted with Number() before saving.
    // -------------------------------------------------------------------------
    contract.on(
      "DrugTransferred",
      async function (drugID, from, to, lat, lng, timestamp, event) {
        try {
          await EventLog.create({
            eventName: "DrugTransferred",
            drugID: drugID,
            data: {
              from: from,
              to: to,
              lat: Number(lat) / 1e6,
              lng: Number(lng) / 1e6,
              timestamp: Number(timestamp),
            },
            transactionHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
          });
          console.log("Event saved: DrugTransferred", drugID);
        } catch (err) {
          console.error("EventLog save error (DrugTransferred):", err.message);
        }
      }
    );

    // -------------------------------------------------------------------------
    // RiskScoreUpdated(string drugID, uint256 riskScore)
    // -------------------------------------------------------------------------
    contract.on(
      "RiskScoreUpdated",
      async function (drugID, riskScore, event) {
        try {
          await EventLog.create({
            eventName: "RiskScoreUpdated",
            drugID: drugID,
            data: { riskScore: Number(riskScore) },
            transactionHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
          });
          console.log("Event saved: RiskScoreUpdated", drugID);
        } catch (err) {
          console.error("EventLog save error (RiskScoreUpdated):", err.message);
        }
      }
    );

    // -------------------------------------------------------------------------
    // DrugRecalled(string drugID, uint256 timestamp)
    // -------------------------------------------------------------------------
    contract.on("DrugRecalled", async function (drugID, timestamp, event) {
      try {
        await EventLog.create({
          eventName: "DrugRecalled",
          drugID: drugID,
          data: { timestamp: Number(timestamp) },
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
        });
        console.log("Event saved: DrugRecalled", drugID);
      } catch (err) {
        console.error("EventLog save error (DrugRecalled):", err.message);
      }
    });

    // -------------------------------------------------------------------------
    // RoleAssigned(address indexed user, uint8 role)
    // Note: user is indexed so it arrives as the first positional arg.
    // drugID is null -- this event has no associated drug.
    // -------------------------------------------------------------------------
    contract.on("RoleAssigned", async function (user, role, event) {
      try {
        await EventLog.create({
          eventName: "RoleAssigned",
          drugID: null,
          data: { user: user, role: Number(role) },
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
        });
        console.log("Event saved: RoleAssigned", user);
      } catch (err) {
        console.error("EventLog save error (RoleAssigned):", err.message);
      }
    });

    // -------------------------------------------------------------------------
    // Provider-level error handler
    // -------------------------------------------------------------------------
    provider.on("error", function (error) {
      console.error("Provider error:", error.message);
      sendAlert("Blockchain provider connection error", {
        error: error.message,
        rpcUrl: process.env.RPC_URL,
      });
    });

    console.log("Blockchain event listener started");
    console.log("Contract:", process.env.CONTRACT_ADDRESS);
    console.log("Network: Polygon Amoy");
  } catch (err) {
    console.error("EventListener start error:", err.message);
    sendAlert("Failed to start blockchain event listener", {
      error: err.message,
    });
  }
}

/**
 * Stop listening and release all resources.
 */
function stopListening() {
  if (contract) {
    contract.removeAllListeners();
    console.log("Event listeners removed");
  }
  if (provider) {
    provider.destroy();
    console.log("Provider connection destroyed");
  }
  console.log("Event listener stopped");
}

module.exports = { startListening, stopListening };
