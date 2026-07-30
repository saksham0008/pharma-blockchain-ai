const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true, index: true },
  role: { type: String, enum: ["None", "Admin", "Manufacturer", "Distributor", "Pharmacy", "Consumer"], required: true },
  displayName: { type: String, default: "" },
  contactEmail: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
