const express = require("express");
const cors = require("cors");
const contract = require("./contract");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Pharma Blockchain Backend Running");
});

// Create Drug
app.post("/createDrug", async (req, res) => {
  try {
    const { drugID, name, batch, expiry } = req.body;

    const tx = await contract.createDrug(drugID, name, batch, expiry);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Drug
app.get("/getDrug/:id", async (req, res) => {
  try {
    const data = await contract.getDrug(req.params.id);

    const formattedData = {
      drugID: data.drugID,
      name: data.name,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate.toString(),
      currentOwner: data.currentOwner,
      riskScore: data.riskScore.toString(),
      exists: data.exists
    };

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// Assign Role
app.post("/assignRole", async (req, res) => {
  try {
    const { address, role } = req.body;

    const tx = await contract.assignRole(address, role);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});