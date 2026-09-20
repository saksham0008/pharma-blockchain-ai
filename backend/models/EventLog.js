const mongoose = require("mongoose");

/**
 * EventLog Model
 * Stores blockchain events from PharmaSupplyChain.sol deployed on Polygon Amoy.
 * 
 * Supported events:
 *   - DrugCreated
 *   - DrugTransferred
 *   - RiskScoreUpdated
 *   - DrugRecalled
 *   - RoleAssigned
 */

const eventLogSchema = new mongoose.Schema({
  // Event type name (e.g., "DrugCreated", "DrugTransferred")
  eventName: {
    type: String,
    required: true,
    index: true
  },

  // Drug ID (null for RoleAssigned events)
  drugID: {
    type: String,
    default: null,
    index: true
  },

  // Event-specific data (manufacturer, from/to addresses, GPS coords, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Transaction hash from blockchain
  transactionHash: {
    type: String,
    required: false
  },

  // Block number where event was emitted
  blockNumber: {
    type: Number,
    required: false
  },

  // Timestamp when event was captured
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient filtering by event type and drug ID
eventLogSchema.index({ eventName: 1, drugID: 1 });

// Index for sorting by creation time
eventLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("EventLog", eventLogSchema);
