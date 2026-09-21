require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("./abi/PharmaSupplyChain.json").abi;

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL,
    { chainId: 80002, name: "amoy" },
    { staticNetwork: true, batchMaxCount: 1 }
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

  const targetWallet = "0x4f49Dc9B6C3f403ec266Df7Ea8E539cC1125Df7B";
  console.log("Assigning Admin role (1) to:", targetWallet);
  console.log("Contract:", process.env.CONTRACT_ADDRESS);
  console.log("Using RPC:", process.env.RPC_URL);

  try {
    const tx = await contract.assignRole(targetWallet, 1);
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Admin role assigned! Block:", receipt.blockNumber);
  } catch (err) {
    console.error("Error:", err.reason || err.message);
  }
}

main();
