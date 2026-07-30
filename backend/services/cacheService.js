const DrugCache = require("../models/DrugCache");

const CACHE_TTL_SECONDS = DrugCache.schema.statics.CACHE_TTL_SECONDS;

// Validate TTL at startup — throw if not exactly 60 seconds
function validateTTLConfig() {
  DrugCache.validateTTL(CACHE_TTL_SECONDS);
}

/**
 * Get cached drug data by drugID.
 * Returns the cached data object if valid, or null if expired/missing.
 */
async function get(drugID) {
  try {
    const entry = await DrugCache.findOne({ drugID });
    if (!entry) return null;
    // Double-check expiry in app layer (MongoDB TTL index may have some delay)
    if (new Date() > entry.expiresAt) {
      await DrugCache.deleteOne({ drugID });
      return null;
    }
    return entry.data;
  } catch (err) {
    console.error("CacheService.get error:", err.message);
    return null;
  }
}

/**
 * Set cached drug data for drugID with exactly 60s TTL.
 */
async function set(drugID, data) {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);
    await DrugCache.findOneAndUpdate(
      { drugID },
      { drugID, data, cachedAt: now, expiresAt },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("CacheService.set error:", err.message);
  }
}

/**
 * Invalidate (delete) the cache entry for drugID.
 * Called immediately after a transfer to ensure next read is fresh.
 */
async function invalidate(drugID) {
  try {
    await DrugCache.deleteOne({ drugID });
  } catch (err) {
    console.error("CacheService.invalidate error:", err.message);
  }
}

module.exports = { get, set, invalidate, validateTTLConfig, CACHE_TTL_SECONDS };
