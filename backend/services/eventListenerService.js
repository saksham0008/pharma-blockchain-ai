require("dotenv").config();
const { ethers } = require("ethers");
const EventLog = require("../models/EventLog");
const contractABI = require("../abi/PharmaSupplyChain.json").abi;

let provider = null;
let contract = null;

function startListening() {
  if (!process.env.RPC_URL || !process.env.CONTRACT_ADDRESS) {
    console.warn("EventListener: Missing RPC_URL or CONTRACT_ADDRESS — skipping");
    return;
  }

  try {
    provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL,
      { chainId: 80002, name: "amoy" },
      { staticNetwork: true, batchMaxCount: 1 }
    );

    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

    contract.on("DrugCreated", async (drugID, manufacturer, event) => {
      try {
        await EventLog.create({ eventName: "DrugCreated", drugID, data: { manufacturer }, transactionHash: event?.log?.transactionHash, blockNumber: event?.log?.blockNumber });
        console.log("Event: DrugCreated", drugID);
      } catch (err) { console.error("EventLog error:", err.message); }
    });

    contract.on("DrugTransferred", async (drugID, from, to, lat, lng, timestamp, event) => {
      try {
        await EventLog.create({ eventName: "DrugTransferred", drugID, data: { from, to, lat: Number(lat) / 1e6, lng: Number(lng) / 1e6, timestamp: Number(timestamp) }, transactionHash: event?.log?.transactionHash, blockNumber: event?.log?.blockNumber });
        console.log("Event: DrugTransferred", drugID);
      } catch (err) { console.error("EventLog error:", err.message); }
    });

    contract.on("RiskScoreUpdated", async (drugID, riskScore, event) => {
      try {
        await EventLog.create({ eventName: "RiskScoreUpdated", drugID, data: { riskScore: Number(riskScore) }, transactionHash: event?.log?.transactionHash, blockNumber: event?.log?.blockNumber });
      } catch (err) { console.error("EventLog error:", err.message); }
    });

    contract.on("DrugRecalled", async (drugID, timestamp, event) => {
      try {
        await EventLog.create({ eventName: "DrugRecalled", drugID, data: { timestamp: Number(timestamp) }, transactionHash: event?.log?.transactionHash, blockNumber: event?.log?.blockNumber });
        console.log("Event: DrugRecalled", drugID);
      } catch (err) { console.error("EventLog error:", err.message); }
    });

    contract.on("RoleAssigned", async (user, role, event) => {
      try {
        await EventLog.create({ eventName: "RoleAssigned", drugID: null, data: { user, role: Number(role) }, transactionHash: event?.log?.transactionHash, blockNumber: event?.log?.blockNumber });
      } catch (err) { console.error("EventLog error:", err.message); }
    });

    // Suppress provider errors — never crash the server
    provider.on("error", (err) => {
      console.warn("EventListener RPC warning (non-fatal):", err?.shortMessage || err?.message || "unknown error");
    });

    console.log("Blockchain event listener started — Contract:", process.env.CONTRACT_ADDRESS);
  } catch (err) {
    console.warn("EventListener failed to start (non-fatal):", err.message);
  }
}

function stopListening() {
  if (contract) contract.removeAllListeners();
  if (provider) provider.destroy();
  console.log("Event listener stopped");
}

module.exports = { startListening, stopListening };
