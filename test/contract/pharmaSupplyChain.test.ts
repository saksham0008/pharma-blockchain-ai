import { expect } from "chai";
import { ethers } from "hardhat";

async function expectRevert(txPromise: Promise<any>, messageSubstring: string): Promise<void> {
  let reverted = false;
  let errorMsg = "";
  try { await txPromise; }
  catch (err: any) {
    reverted = true;
    errorMsg = err?.reason ?? err?.data?.message ?? err?.message ?? String(err);
  }
  expect(reverted, `Expected revert with "${messageSubstring}" but tx succeeded`).to.equal(true);
  expect(errorMsg.includes(messageSubstring), `Expected "${messageSubstring}", got: ${errorMsg}`).to.equal(true);
}

describe("PharmaSupplyChain - Unit Tests", function () {
  this.timeout(120000);

  async function deploy() {
    const [admin, manufacturer, distributor, other] = await ethers.getSigners();
    const Pharma = await ethers.getContractFactory("PharmaSupplyChain");
    const contract = await Pharma.deploy();
    await contract.deployed();
    // Assign roles: Manufacturer=2, Distributor=3
    await contract.assignRole(manufacturer.address, 2);
    await contract.assignRole(distributor.address, 3);
    return { contract, admin, manufacturer, distributor, other };
  }

  const futureExpiry = () => Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

  // ── Role Management ──────────────────────────────────────────────────────────

  describe("assignRole", () => {
    it("emits RoleAssigned event", async () => {
      const { contract, admin, other } = await deploy();
      const tx = await contract.assignRole(other.address, 2);
      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "RoleAssigned");
      expect(event).to.exist;
      expect(event.args.user.toLowerCase()).to.equal(other.address.toLowerCase());
    });

    it("reverts if called by non-admin", async () => {
      const { contract, other } = await deploy();
      await expectRevert(
        contract.connect(other).assignRole(other.address, 2),
        "Only admin allowed"
      );
    });
  });

  // ── Drug Registration ────────────────────────────────────────────────────────

  describe("createDrug", () => {
    it("reverts with 'Drug already exists' on duplicate drugID", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "DUP-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "A", "B1", futureExpiry())).wait();
      await expectRevert(
        contract.connect(manufacturer).createDrug(id, "B", "B2", futureExpiry()),
        "Drug already exists"
      );
    });

    it("reverts with 'Unauthorized role' if caller has no Manufacturer role", async () => {
      const { contract, other } = await deploy();
      await expectRevert(
        contract.connect(other).createDrug("UNAUTH-" + Date.now(), "X", "B1", futureExpiry()),
        "Unauthorized role"
      );
    });
  });

  // ── Drug Status ──────────────────────────────────────────────────────────────

  describe("getDrugStatus", () => {
    it("returns Active (0) for a newly created drug with future expiry", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "ACTIVE-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "Test", "B1", futureExpiry())).wait();
      expect(Number(await contract.getDrugStatus(id))).to.equal(0); // Active
    });

    it("returns Expired (2) for a drug with past expiry", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "EXPIRED-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "Old", "B1", 1)).wait();
      expect(Number(await contract.getDrugStatus(id))).to.equal(2); // Expired
    });

    it("returns Recalled (1) after recallDrug", async () => {
      const { contract, admin, manufacturer } = await deploy();
      const id = "RECALLED-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "R", "B1", futureExpiry())).wait();
      await (await contract.connect(admin).recallDrug(id)).wait();
      expect(Number(await contract.getDrugStatus(id))).to.equal(1); // Recalled
    });

    it("reverts for non-existent drugID", async () => {
      const { contract } = await deploy();
      await expectRevert(contract.getDrugStatus("NONEXISTENT-999"), "Drug not found");
    });
  });

  // ── Recall ───────────────────────────────────────────────────────────────────

  describe("recallDrug", () => {
    it("emits DrugRecalled event", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "RECALL-EVT-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "R", "B1", futureExpiry())).wait();
      const tx = await contract.recallDrug(id);
      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "DrugRecalled");
      expect(event).to.exist;
      expect(event.args.drugID).to.equal(id);
    });

    it("reverts with 'Only admin allowed' for non-admin caller", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "RECALL-NONADMIN-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "R", "B1", futureExpiry())).wait();
      await expectRevert(
        contract.connect(manufacturer).recallDrug(id),
        "Only admin allowed"
      );
    });

    it("reverts with 'Drug already recalled' on double recall", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "DOUBLE-RECALL-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "R", "B1", futureExpiry())).wait();
      await (await contract.recallDrug(id)).wait();
      await expectRevert(contract.recallDrug(id), "Drug already recalled");
    });
  });

  // ── Transfer ─────────────────────────────────────────────────────────────────

  describe("transferDrug", () => {
    it("reverts with 'Not owner' if caller is not current owner", async () => {
      const { contract, manufacturer, distributor, other } = await deploy();
      const id = "NOTOWNER-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      await expectRevert(
        contract.connect(other).transferDrug(id, distributor.address, 28614000, 77209000),
        "Not owner"
      );
    });

    it("reverts with 'Drug not found' for non-existent drug", async () => {
      const { contract, manufacturer, distributor } = await deploy();
      await expectRevert(
        contract.connect(manufacturer).transferDrug("GHOST-999", distributor.address, 0, 0),
        "Drug not found"
      );
    });

    it("reverts with 'Cannot transfer recalled drug'", async () => {
      const { contract, manufacturer, distributor } = await deploy();
      const id = "RECALLED-XFER-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      await (await contract.recallDrug(id)).wait();
      await expectRevert(
        contract.connect(manufacturer).transferDrug(id, distributor.address, 0, 0),
        "Cannot transfer recalled drug"
      );
    });

    it("increments getTransferCount after each transfer", async () => {
      const { contract, manufacturer, distributor } = await deploy();
      const id = "COUNT-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      expect(Number(await contract.getTransferCount(id))).to.equal(0);
      await (await contract.connect(manufacturer).transferDrug(id, distributor.address, 28614000, 77209000)).wait();
      expect(Number(await contract.getTransferCount(id))).to.equal(1);
      await (await contract.connect(distributor).transferDrug(id, manufacturer.address, 19000000, 72800000)).wait();
      expect(Number(await contract.getTransferCount(id))).to.equal(2);
    });

    it("getTransferHistory returns entries with correct fields", async () => {
      const { contract, manufacturer, distributor } = await deploy();
      const id = "HIST-" + Date.now();
      const lat = 28614000; // 28.614 * 1e6
      const lng = 77209000; // 77.209 * 1e6
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      await (await contract.connect(manufacturer).transferDrug(id, distributor.address, lat, lng)).wait();

      const history = await contract.getTransferHistory(id);
      expect(history.length).to.equal(1);
      expect(history[0].from.toLowerCase()).to.equal(manufacturer.address.toLowerCase());
      expect(history[0].to.toLowerCase()).to.equal(distributor.address.toLowerCase());
      expect(Number(history[0].lat)).to.equal(lat);
      expect(Number(history[0].lng)).to.equal(lng);
      expect(Number(history[0].index)).to.equal(0);
    });

    it("transfer history is append-only — previous entries unchanged after new transfer", async () => {
      const { contract, manufacturer, distributor, other } = await deploy();
      await contract.assignRole(other.address, 4); // Pharmacy role
      const id = "IMMUTABLE-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      const lat1 = 100000, lng1 = 200000;
      const lat2 = 300000, lng2 = 400000;
      await (await contract.connect(manufacturer).transferDrug(id, distributor.address, lat1, lng1)).wait();
      await (await contract.connect(distributor).transferDrug(id, other.address, lat2, lng2)).wait();

      const history = await contract.getTransferHistory(id);
      expect(history.length).to.equal(2);
      // First entry must be unchanged
      expect(Number(history[0].lat)).to.equal(lat1);
      expect(Number(history[0].lng)).to.equal(lng1);
      expect(Number(history[0].index)).to.equal(0);
      // Second entry is correct
      expect(Number(history[1].lat)).to.equal(lat2);
      expect(Number(history[1].index)).to.equal(1);
    });
  });

  // ── updateRiskScore ──────────────────────────────────────────────────────────

  describe("updateRiskScore", () => {
    it("reverts with 'Only admin allowed' for non-admin", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "RISK-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      await expectRevert(
        contract.connect(manufacturer).updateRiskScore(id, 50),
        "Only admin allowed"
      );
    });

    it("admin can set and read riskScore via getDrug", async () => {
      const { contract, manufacturer } = await deploy();
      const id = "RISKSCORE-" + Date.now();
      await (await contract.connect(manufacturer).createDrug(id, "T", "B1", futureExpiry())).wait();
      await (await contract.updateRiskScore(id, 75)).wait();
      const drug = await contract.getDrug(id);
      expect(Number(drug.riskScore)).to.equal(75);
    });
  });
});
