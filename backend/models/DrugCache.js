const mongoose = require("mongoose");

const CACHE_TTL_SECONDS = 60;

const drugCacheSchema = new mongoose.Schema({
  drugID: { type: String, required: true, unique: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// TTL index — MongoDB removes the document when expiresAt is reached
drugCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Startup validation helper
drugCacheSchema.statics.validateTTL = function(ttlSeconds) {
  if (ttlSeconds !== CACHE_TTL_SECONDS) {
    throw new Error(`DrugCache TTL must be exactly ${CACHE_TTL_SECONDS} seconds, got ${ttlSeconds}`);
  }
};

drugCacheSchema.statics.CACHE_TTL_SECONDS = CACHE_TTL_SECONDS;

module.exports = mongoose.model("DrugCache", drugCacheSchema);
