import { expect } from "chai";
import { ethers } from "hardhat";
import * as fc from "fast-check";

// Feature: pharma-blockchain-ai
// Properties 1, 2, 3, 4 — Drug Registration correctness
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6

/**
 * Helper: assert a tx reverts with the given message substring.
 * Works with ethers v5 / @nomiclabs/hardhat-ethers (no hardhat-chai-matchers needed).
 */
async function expectRevert(
  txPromise: Promise<any>,
  messageSubstring: string
): Promise<void> {
  let reverted = false;
  let errorMsg = "";
  try {
    await txPromise;
  } catch (err: any) {
    reverted = true;
    errorMsg =
      err?.reason ?? err?.data?.message ?? err?.message ?? String(err);
  }
  expect(reverted, `Expected revert with "${messageSubstring}" but tx succeeded`).to.equal(true);
  expect(
    errorMsg.includes(messageSubstring),
    `Expected error to contain "${messageSubstring}", got: ${errorMsg}`
  ).to.equal(true);
}

describe("PharmaSupplyChain - Drug Registration Properties", function () {
  // Increase timeout for property-based tests running on-chain
  this.timeout(300000);

  async function deployContract() {
    const [admin, manufacturer, other] = await ethers.getSigners();
    const Pharma = await ethers.getContractFactory("PharmaSupplyChain");
    const contract = await Pharma.deploy();
    // ethers v5 / @nomiclabs/hardhat-ethers v2 — use .deployed()
    await contract.deployed();

    // Assign Manufacturer role (Role enum: None=0, Admin=1, Manufacturer=2, ...)
    await contract.assignRole(manufacturer.address, 2);
    return { contract, admin, manufacturer, other };
  }

  // ─── Property 1: Drug Registration Round-Trip ────────────────────────────────
  // For any valid registration, getDrug returns the exact submitted values.
  // **Validates: Requirements 1.1, 1.4**
  it("Property 1: Drug registration round-trip — getDrug returns submitted values", async function () {
    const { contract, manufacturer } = await deployContract();

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Use printable ASCII-only strings to avoid Solidity encoding issues
          suffix: fc.integer({ min: 1, max: 99999 }),
          name: fc
            .string({ minLength: 1, maxLength: 32 })
            .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.trim().length > 0),
          batch: fc
            .string({ minLength: 1, maxLength: 16 })
            .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.trim().length > 0),
          // Expiry is a random offset 1 day – 1 year into the future
          expiryOffset: fc.integer({ min: 86400, max: 31536000 }),
        }),
        async ({ suffix, name, batch, expiryOffset }) => {
          // Build a unique drugID for each fast-check iteration to avoid "Drug already exists"
          const drugID = `P1-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const futureExpiry = Math.floor(Date.now() / 1000) + expiryOffset;

          const tx = await contract
            .connect(manufacturer)
            .createDrug(drugID, name, batch, futureExpiry);
          await tx.wait();

          const drug = await contract.getDrug(drugID);

          // ethers v5 returns BigNumber for uint256 fields
          return (
            drug.drugID === drugID &&
            drug.name === name &&
            drug.batchNumber === batch &&
            drug.expiryDate.toNumber() === futureExpiry &&
            drug.currentOwner.toLowerCase() ===
              manufacturer.address.toLowerCase() &&
            drug.riskScore.toNumber() === 0 &&
            drug.exists === true &&
            drug.recalled === false
          );
        }
      ),
      { numRuns: 5 }
    );
  });

  // ─── Property 2: Duplicate Drug Registration Is Always Rejected ──────────────
  // Registering the same drugID twice must always revert with "Drug already exists".
  // **Validates: Requirements 1.2**
  it("Property 2: Duplicate registration always reverts", async function () {
    const { contract, manufacturer } = await deployContract();
    const futureExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

    const drugID = "PROP2-TEST-" + Date.now();
    await (
      await contract
        .connect(manufacturer)
        .createDrug(drugID, "TestDrug", "BATCH-1", futureExpiry)
    ).wait();

    await expectRevert(
      contract
        .connect(manufacturer)
        .createDrug(drugID, "AnotherDrug", "BATCH-2", futureExpiry),
      "Drug already exists"
    );
  });

  // ─── Property 3: Unauthorized Role Always Reverts createDrug ─────────────────
  // Any account without the Manufacturer role must not be able to call createDrug.
  // **Validates: Requirements 1.3**
  it("Property 3: Non-manufacturer cannot call createDrug", async function () {
    const { contract, other } = await deployContract();
    const futureExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

    await expectRevert(
      contract
        .connect(other)
        .createDrug("DRUG-UNAUTH-" + Date.now(), "Test", "BATCH-1", futureExpiry),
      "Unauthorized role"
    );
  });

  // ─── Property 4: Past Expiry Timestamp Results in Expired Status ─────────────
  // A drug created with an expiry in the past must be reported as Expired
  // by getDrugStatus (DrugStatus.Expired == 2).
  // **Validates: Requirements 1.4, 1.6**
  it("Property 4: Past expiry timestamp is always reported as Expired status", async function () {
    const { contract, manufacturer } = await deployContract();

    // Unix timestamp 1 is always in the past (Jan 1, 1970)
    const pastExpiry = 1;
    const drugID = "PROP4-EXPIRED-" + Date.now();

    await (
      await contract
        .connect(manufacturer)
        .createDrug(drugID, "ExpiredDrug", "BATCH-EXP", pastExpiry)
    ).wait();

    const status = await contract.getDrugStatus(drugID);
    // DrugStatus enum: Active=0, Recalled=1, Expired=2
    // ethers v5 returns a plain number for enum return values
    expect(Number(status)).to.equal(2);
  });
});
