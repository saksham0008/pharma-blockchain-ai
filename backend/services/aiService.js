require("dotenv").config();
const axios = require("axios");
const contractService = require("./contractService");
const AiScoreLog = require("../models/AiScoreLog");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:5000";
const AI_TIMEOUT_MS = 5000;

// Exponential backoff retry for on-chain updateRiskScore
async function _retryUpdateOnChain(drugID, score, maxRetries = 3) {
  let delay = 2000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await contractService.updateRiskScore(drugID, score);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`updateRiskScore failed after ${maxRetries} retries for ${drugID}:`, err.message);
        return;
      }
      console.warn(`updateRiskScore attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

/**
 * Score a drug using the AI engine.
 * Returns { score, category } — falls back to last known score if engine is unavailable.
 */
async function score(inputs) {
  const { drugID } = inputs;
  let result = { score: 0, category: "Uncolored" };

  try {
    const response = await axios.post(`${AI_ENGINE_URL}/score`, inputs, {
      timeout: AI_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" }
    });
    result = response.data;
  } catch (err) {
    console.warn(`AI engine unavailable for ${drugID}:`, err.message);
    // Retain last known score from chain
    try {
      const drug = await contractService.getDrug(drugID);
      const lastScore = drug.riskScore || 0;
      result = {
        score: lastScore,
        category: _getCategory(lastScore)
      };
    } catch {
      // Leave defaults
    }
  }

  // Log to audit trail
  try {
    await AiScoreLog.create({
      drugID,
      inputs,
      score: result.score,
      category: result.category,
      scoredAt: new Date(),
      triggeredBy: inputs.triggeredBy || "transfer"
    });
  } catch (logErr) {
    console.error("AiScoreLog write failed (non-fatal):", logErr.message);
  }

  return result;
}

/**
 * Update on-chain risk score with exponential backoff retry.
 */
async function updateOnChainScore(drugID, scoreValue) {
  await _retryUpdateOnChain(drugID, scoreValue);
}

function _getCategory(score) {
  if (score === 0) return "Uncolored";
  if (score <= 24) return "Low";
  if (score <= 49) return "Medium";
  if (score <= 74) return "High";
  return "Critical";
}

module.exports = { score, updateOnChainScore };
