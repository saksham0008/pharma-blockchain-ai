import React from "react";

function getRiskLevel(riskScore, riskCategory) {
  if (riskCategory) {
    return String(riskCategory).toUpperCase();
  }

  const score = Number(riskScore);

  if (Number.isNaN(score)) {
    return "UNKNOWN";
  }

  if (score <= 24) {
    return "LOW";
  }

  if (score <= 49) {
    return "MEDIUM";
  }

  if (score <= 74) {
    return "HIGH";
  }

  return "CRITICAL";
}

function getRiskStyles(level) {
  switch (level) {
    case "LOW":
      return {
        background: "#dcfce7",
        border: "#16a34a",
        text: "#166534",
      };

    case "MEDIUM":
      return {
        background: "#fef3c7",
        border: "#d97706",
        text: "#92400e",
      };

    case "HIGH":
      return {
        background: "#ffedd5",
        border: "#ea580c",
        text: "#9a3412",
      };

    case "CRITICAL":
      return {
        background: "#fee2e2",
        border: "#dc2626",
        text: "#991b1b",
      };

    default:
      return {
        background: "#f3f4f6",
        border: "#6b7280",
        text: "#374151",
      };
  }
}

function RiskBadge({ riskScore, riskCategory }) {
  const level = getRiskLevel(
    riskScore,
    riskCategory
  );

  const styles = getRiskStyles(level);

  return (
    <div
      className="risk-badge"
      style={{
        padding: "18px",
        border: `2px solid ${styles.border}`,
        borderRadius: "10px",
        background: styles.background,
        color: styles.text,
        textAlign: "center",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "10px",
        }}
      >
        Risk Assessment
      </h2>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "700",
          marginBottom: "8px",
        }}
      >
        {level}
      </div>

      <p
        style={{
          margin: 0,
        }}
      >
        <strong>Risk Score:</strong>{" "}
        {riskScore ?? "N/A"}
      </p>
    </div>
  );
}

export default RiskBadge;
