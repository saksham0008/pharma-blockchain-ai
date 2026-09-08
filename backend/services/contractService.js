require("dotenv").config();
const { ethers } = require("ethers");
const contractABI = require("../abi/PharmaSupplyChain.json").abi;

// Role name → enum index mapping
const ROLE_NAMES = ["None", "Admin", "Manufacturer", "Distributor", "Pharmacy", "Consumer"];
const DRUG_STATUS_NAMES = ["Active", "Recalled", "Expired"];

let provider, wallet, contract;

function init() {
  if (contract) return contract;
  if (!process.env.RPC_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
    console.warn("ContractService: Missing RPC_URL, PRIVATE_KEY, or CONTRACT_ADDRESS — blockchain calls will fail");
    return null;
  }
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
  return contract;
}

// ── Write functions ────────────────────────────────────────────────────────────

async function createDrug(drugID, name, batchNumber, expiryTimestamp) {
  const c = init();
  const tx = await c.createDrug(drugID, name, batchNumber, BigInt(expiryTimestamp));
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

async function transferDrug(drugID, newOwner, lat, lng) {
  const c = init();
  // Convert float GPS to fixed-point int256 * 1e6
  const latInt = BigInt(Math.round(lat * 1e6));
  const lngInt = BigInt(Math.round(lng * 1e6));
  const tx = await c.transferDrug(drugID, newOwner, latInt, lngInt);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

async function recallDrug(drugID) {
  const c = init();
  const tx = await c.recallDrug(drugID);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

async function updateRiskScore(drugID, riskScore) {
  const c = init();
  if (riskScore < 0 || riskScore > 100) throw new Error("Risk score out of range");
  const tx = await c.updateRiskScore(drugID, BigInt(riskScore));
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

async function assignRole(address, roleIndex) {
  const c = init();
  const tx = await c.assignRole(address, roleIndex);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

// ── Read functions ─────────────────────────────────────────────────────────────

async function getDrug(drugID) {
  const c = init();
  const d = await c.getDrug(drugID);
  return {
    drugID: d.drugID,
    name: d.name,
    batchNumber: d.batchNumber,
    expiryDate: Number(d.expiryDate),
    currentOwner: d.currentOwner,
    riskScore: Number(d.riskScore),
    exists: d.exists,
    recalled: d.recalled,
    transferHistory: _formatHistory(d.transferHistory)
  };
}

async function getDrugStatus(drugID) {
  const c = init();
  const statusIndex = await c.getDrugStatus(drugID);
  return DRUG_STATUS_NAMES[Number(statusIndex)] || "Active";
}

async function getTransferHistory(drugID) {
  const c = init();
  const raw = await c.getTransferHistory(drugID);
  return _formatHistory(raw);
}

async function getTransferCount(drugID) {
  const c = init();
  const count = await c.getTransferCount(drugID);
  return Number(count);
}

async function getRoleOf(address) {
  const c = init();
  const roleIndex = await c.roles(address);
  return { index: Number(roleIndex), name: ROLE_NAMES[Number(roleIndex)] || "None" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _formatHistory(rawHistory) {
  return rawHistory.map(ev => ({
    from: ev.from,
    to: ev.to,
    lat: Number(ev.lat) / 1e6,
    lng: Number(ev.lng) / 1e6,
    timestamp: Number(ev.timestamp),
    index: Number(ev.index)
  }));
}

module.exports = {
  init,
  createDrug,
  transferDrug,
  recallDrug,
  updateRiskScore,
  assignRole,
  getDrug,
  getDrugStatus,
  getTransferHistory,
  getTransferCount,
  getRoleOf,
  ROLE_NAMES,
  DRUG_STATUS_NAMES
};
