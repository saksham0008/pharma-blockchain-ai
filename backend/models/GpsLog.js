const mongoose = require("mongoose");

const gpsLogSchema = new mongoose.Schema({
  drugID: { type: String, required: true, index: true },
  transferIndex: { type: Number, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  actorAddress: { type: String, required: true, lowercase: true },
  actorRole: { type: String, default: "" },
  locationName: { type: String, default: null },
  timestamp: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("GpsLog", gpsLogSchema);
