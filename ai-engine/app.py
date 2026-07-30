"""
Feature: pharma-blockchain-ai
AI Engine — Flask HTTP service for risk scoring.
"""

import os
from flask import Flask, request, jsonify
from scorer import compute_risk_score

app = Flask(__name__)


@app.route("/", methods=["GET"])
def root():
    return jsonify({"service": "pharma-ai-engine", "status": "running"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/score", methods=["POST"])
def score():
    """
    POST /score
    Body (JSON):
    {
      "expiryTimestamp": int,
      "transferCount": int,
      "transferTimestamps": [int],
      "gpsCoordinates": [{"lat": float, "lng": float}],
      "batchRecalled": bool,
      "manufacturerReputation": float
    }
    Returns: {"score": int, "category": str}
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ["expiryTimestamp"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        result = compute_risk_score(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("AI_ENGINE_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
