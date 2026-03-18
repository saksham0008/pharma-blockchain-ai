import { ethers } from "hardhat";

async function main() {

  const Pharma = await ethers.getContractFactory("PharmaSupplyChain");

  const pharma = await Pharma.deploy();

  await pharma.deployed();

  console.log("PharmaSupplyChain deployed to:", pharma.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});