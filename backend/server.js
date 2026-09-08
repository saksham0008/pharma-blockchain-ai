require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Route imports
const authRoutes = require("./routes/auth");
const drugsRoutes = require("./routes/drugs");
const transferRoutes = require("./routes/transfer");
const qrRoutes = require("./routes/qr");
const adminRoutes = require("./routes/admin");
const fabricRoutes = require("./routes/fabric");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// MongoDB connection
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));
}

// Root
app.get("/", (req, res) => {
  res.json({ message: "Pharma Blockchain Backend Running", version: "2.0" });
});

// Mount modular routes
app.use("/auth", authRoutes);
app.use("/api/drugs", drugsRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api", qrRoutes);   // covers GET /api/generateQR/:drugID
app.use("/", qrRoutes);      // covers GET /verify/:drugID at root level
app.use("/admin", adminRoutes);
app.use("/fabric", fabricRoutes);

// ─── LEGACY ENDPOINTS (kept for backward compatibility) ──────────────────────
const contract = require("./contract");

app.post("/createDrug", async (req, res) => {
  try {
    const { drugID, name, batch, expiry } = req.body;
    if (!drugID || !name || !batch || !expiry)
      return res.status(400).json({ error: "All fields are required" });
    const tx = await contract.createDrug(drugID, name, batch, expiry);
    await tx.wait();
    res.json({ success: true, message: "Drug created successfully", txHash: tx.hash });
  } catch (error) {
    console.error("CreateDrug Error:", error);
    res.status(500).json({ error: error.reason || error.message });
  }
});

app.get("/getDrug/:id", async (req, res) => {
  try {
    const data = await contract.getDrug(req.params.id);
    res.json({
      drugID: data.drugID, name: data.name, batchNumber: data.batchNumber,
      expiryDate: data.expiryDate.toString(), currentOwner: data.currentOwner,
      riskScore: data.riskScore.toString(), exists: data.exists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/assignRole", async (req, res) => {
  try {
    const { address, role } = req.body;
    if (!address || role === undefined)
      return res.status(400).json({ error: "Address and role required" });
    const tx = await contract.assignRole(address, role);
    await tx.wait();
    res.json({ success: true, message: "Role assigned", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// /generateQR/:drugID and /verify/:drugID legacy paths
// now handled by qrRoutes mounted at "/api" and "/" above
// ─── END LEGACY ──────────────────────────────────────────────────────────────

const http = require("http");
const wsService = require("./services/wsService");

const httpServer = http.createServer(app);
wsService.init(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Pharma Blockchain Backend running on port ${PORT}`);
});
