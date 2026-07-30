const mongoose = require("mongoose");

const aiScoreLogSchema = new mongoose.Schema({
  drugID: { type: String, required: true, index: true },
  inputs: { type: mongoose.Schema.Types.Mixed, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  category: { type: String, enum: ["Uncolored", "Low", "Medium", "High", "Critical"], required: true },
  scoredAt: { type: Date, default: Date.now },
  triggeredBy: { type: String, enum: ["transfer", "recall", "manual"], default: "transfer" }
});

module.exports = mongoose.model("AiScoreLog", aiScoreLogSchema);
