import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying PharmaSupplyChain contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Pharma = await ethers.getContractFactory("PharmaSupplyChain");
  const pharma = await Pharma.deploy();
  // @nomiclabs/hardhat-ethers (ethers v5) — use deployed() + .address
  await pharma.deployed();

  const contractAddress = pharma.address;
  console.log("PharmaSupplyChain deployed to:", contractAddress);

  console.log("\nAvailable functions:");
  console.log("  createDrug(drugID, name, batchNumber, expiryDate)");
  console.log("  transferDrug(drugID, newOwner, lat, lng)");
  console.log("  recallDrug(drugID)");
  console.log("  updateRiskScore(drugID, riskScore)");
  console.log("  assignRole(address, role)");
  console.log("  getDrug(drugID)");
  console.log("  getDrugStatus(drugID)");
  console.log("  getTransferHistory(drugID)");
  console.log("  getTransferCount(drugID)");

  // Copy ABI to backend
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts",
    "PharmaSupplyChain.sol", "PharmaSupplyChain.json"
  );
  const backendAbiPath = path.join(__dirname, "..", "backend", "abi", "PharmaSupplyChain.json");

  if (fs.existsSync(artifactPath)) {
    fs.mkdirSync(path.dirname(backendAbiPath), { recursive: true });
    fs.copyFileSync(artifactPath, backendAbiPath);
    console.log("\nABI copied to backend/abi/PharmaSupplyChain.json");
  } else {
    console.warn("\nArtifact not found — run `npx hardhat compile` first.");
  }

  console.log("\nAdd to your .env files:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
