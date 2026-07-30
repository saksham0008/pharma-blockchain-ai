"""
Feature: pharma-blockchain-ai
AI Risk Scoring Engine — Rule-based additive scorer.

5 additive rules, capped at 100. Categories:
  0        → Uncolored
  1–24     → Low
  25–49    → Medium
  50–74    → High
  75–100   → Critical
"""

import time
import math

RULES = {
    "expiry_30d":     20,
    "expiry_90d":     10,
    "transfer_count": 15,
    "time_jump":      20,
    "location_jump":  25,
    "batch_recall":   30,
}

def _haversine_km(lat1, lng1, lat2, lng2):
    """Calculate distance in km between two GPS coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_risk_score(inputs: dict) -> dict:
    """
    Compute a risk score from supply chain signals.

    inputs = {
      "expiryTimestamp":        int,       # Unix epoch seconds
      "transferCount":          int,
      "transferTimestamps":     [int],     # ordered list, Unix seconds
      "gpsCoordinates":         [{"lat": float, "lng": float}],
      "batchRecalled":          bool,
      "manufacturerReputation": float      # 0.0–1.0 (reserved for future ML)
    }

    Returns: {"score": int [0,100], "category": str}
    """
    # Recalled drug is always Critical — override all other signals
    if inputs.get("batchRecalled", False):
        return {"score": 100, "category": "Critical"}

    score = 0
    now = int(time.time())
    expiry = inputs.get("expiryTimestamp", 0)
    seconds_to_expiry = expiry - now

    # Rule 1: Expiry proximity
    if seconds_to_expiry <= 30 * 86400:
        score += RULES["expiry_30d"]
    elif seconds_to_expiry <= 90 * 86400:
        score += RULES["expiry_90d"]

    # Rule 2: Transfer count anomaly
    transfer_count = inputs.get("transferCount", 0)
    if transfer_count > 10:
        score += RULES["transfer_count"]

    # Rule 3: Transfer time anomaly (any two consecutive < 60 seconds apart)
    ts = inputs.get("transferTimestamps", [])
    for i in range(len(ts) - 1):
        if ts[i + 1] - ts[i] < 60:
            score += RULES["time_jump"]
            break

    # Rule 4: Location jump anomaly (speed > 1000 km/h between consecutive points)
    coords = inputs.get("gpsCoordinates", [])
    for i in range(len(coords) - 1):
        if len(ts) > i + 1 and ts[i + 1] != ts[i]:
            dist_km = _haversine_km(
                coords[i]["lat"], coords[i]["lng"],
                coords[i+1]["lat"], coords[i+1]["lng"]
            )
            hours = (ts[i + 1] - ts[i]) / 3600.0
            if hours > 0 and dist_km / hours > 1000:
                score += RULES["location_jump"]
                break

    # Cap at 100
    score = min(score, 100)

    # Derive category
    if score == 0:
        category = "Uncolored"
    elif score <= 24:
        category = "Low"
    elif score <= 49:
        category = "Medium"
    elif score <= 74:
        category = "High"
    else:
        category = "Critical"

    return {"score": score, "category": category}
