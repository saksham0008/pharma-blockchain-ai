require("dotenv").config();

const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const contract = require("./contract");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🚀 Pharma Blockchain Backend Running");
});

// ================= CREATE DRUG =================
app.post("/createDrug", async (req, res) => {
  try {
    const { drugID, name, batch, expiry } = req.body;

    if (!drugID || !name || !batch || !expiry) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const tx = await contract.createDrug(drugID, name, batch, expiry);
    await tx.wait();

    res.json({
      success: true,
      message: "Drug created successfully",
      txHash: tx.hash
    });

  } catch (error) {
    console.error("CreateDrug Error:", error);
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ================= GET DRUG =================
app.get("/getDrug/:id", async (req, res) => {
  try {
    const data = await contract.getDrug(req.params.id);

    const formatted = {
      drugID: data.drugID,
      name: data.name,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate.toString(), // BigInt fix
      currentOwner: data.currentOwner,
      riskScore: data.riskScore.toString(),   // BigInt fix
      exists: data.exists
    };

    res.json(formatted);

  } catch (error) {
    console.error("GetDrug Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= ASSIGN ROLE =================
app.post("/assignRole", async (req, res) => {
  try {
    const { address, role } = req.body;

    if (!address || role === undefined) {
      return res.status(400).json({ error: "Address and role required" });
    }

    const tx = await contract.assignRole(address, role);
    await tx.wait();

    res.json({
      success: true,
      message: "Role assigned",
      txHash: tx.hash
    });

  } catch (error) {
    console.error("AssignRole Error:", error);
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ================= GENERATE QR =================
app.get("/generateQR/:drugID", async (req, res) => {
  try {
    const { drugID } = req.params;

    if (!process.env.BASE_URL) {
      return res.status(500).json({
        error: "BASE_URL missing in .env"
      });
    }

    const verifyURL = `${process.env.BASE_URL}/verify/${drugID}`;

    console.log("QR URL:", verifyURL);

    const qrImage = await QRCode.toDataURL(verifyURL);

    res.json({ qr: qrImage });

  } catch (err) {
    console.error("QR Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= VERIFY DRUG =================
app.get("/verify/:drugID", async (req, res) => {
  try {
    const drug = await contract.getDrug(req.params.drugID);

    const expiry = Number(drug.expiryDate.toString());
    const risk = Number(drug.riskScore.toString());
    const currentTime = Math.floor(Date.now() / 1000);

    let status = "";
    let color = "";

    if (!drug.exists) {
      status = "❌ Fake Drug";
      color = "red";
    } else if (expiry < currentTime) {
      status = "⚠️ Expired Drug";
      color = "orange";
    } else if (risk > 70) {
      status = "🚨 High Risk Drug";
      color = "red";
    } else {
      status = "✅ Authentic Drug";
      color = "green";
    }

    res.send(`
      <h1>💊 Drug Verification</h1>
      <p><b>ID:</b> ${drug.drugID}</p>
      <p><b>Name:</b> ${drug.name}</p>
      <p><b>Batch:</b> ${drug.batchNumber}</p>
      <p><b>Owner:</b> ${drug.currentOwner}</p>
      <p><b>Risk Score:</b> ${risk}</p>
      <p style="color:${color}; font-size:20px;"><b>${status}</b></p>
    `);

  } catch (err) {
    console.error("Verify Error:", err);
    res.send(`<h1>❌ Drug Not Found</h1>`);
  }
});

// ================= START SERVER =================

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});