const FABRIC_ENABLED = !!(process.env.FABRIC_CONNECTION_PROFILE && process.env.FABRIC_WALLET_PATH);

let _contract = null;

async function _connect() {
  if (!FABRIC_ENABLED) throw new Error("FABRIC_UNAVAILABLE: Fabric not configured");
  if (_contract) return _contract;
  let Gateway, Wallets;
  try {
    ({ Gateway, Wallets } = require("fabric-network"));
  } catch {
    throw new Error("FABRIC_UNAVAILABLE: fabric-network package not installed");
  }
  const fs = require("fs");
  const path = require("path");
  const ccp = JSON.parse(fs.readFileSync(path.resolve(process.env.FABRIC_CONNECTION_PROFILE), "utf8"));
  const wallet = await Wallets.newFileSystemWallet(process.env.FABRIC_WALLET_PATH);
  const gw = new Gateway();
  await gw.connect(ccp, { wallet, identity: process.env.FABRIC_IDENTITY || "admin", discovery: { enabled: true, asLocalhost: true } });
  const network = await gw.getNetwork("pharma-channel");
  _contract = network.getContract("pharma");
  return _contract;
}

async function getDrugPrivate(drugID) {
  const c = await _connect();
  const result = await c.evaluateTransaction("GetDrugPrivate", drugID);
  return JSON.parse(result.toString());
}

async function createDrugPrivate(drugID, privateData) {
  const c = await _connect();
  const result = await c.submitTransaction("CreateDrugPrivate", drugID);
  return JSON.parse(result.toString());
}

async function syncToPolygon(drugID, eventType) {
  const c = await _connect();
  await c.submitTransaction("SyncToPolygon", drugID, eventType);
}

async function getDrugHistory(drugID) {
  const c = await _connect();
  const result = await c.evaluateTransaction("GetDrugHistory", drugID);
  return JSON.parse(result.toString());
}

module.exports = { getDrugPrivate, createDrugPrivate, syncToPolygon, getDrugHistory, FABRIC_ENABLED };
