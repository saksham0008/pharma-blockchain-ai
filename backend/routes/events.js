/**
 * Events API Route
 * Exposes blockchain events from EventLog collection.
 * 
 * Endpoints:
 *   GET /api/events - List events with filtering and pagination
 * 
 * Authentication: Required (any role)
 */

const express = require("express");
const EventLog = require("../models/EventLog");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/events
 * Fetch blockchain events with optional filtering.
 * 
 * Query params:
 *   - limit: Number of events to return (default: 20, max: 100)
 *   - eventName: Filter by event type (e.g., "DrugCreated")
 *   - drugID: Filter by specific drug ID
 * 
 * Response:
 *   { events: [...], total: number }
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    // Parse and validate limit parameter
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // Build filter object based on query parameters
    const filter = {};
    
    if (req.query.eventName) {
      filter.eventName = req.query.eventName;
    }
    
    if (req.query.drugID) {
      filter.drugID = req.query.drugID;
    }

    // Execute parallel queries for events and total count
    const [events, total] = await Promise.all([
      EventLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      EventLog.countDocuments(filter)
    ]);

    res.json({ events, total });
  } catch (err) {
    console.error("Events API error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
