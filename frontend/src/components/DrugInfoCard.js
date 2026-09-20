import React from "react";

/**
 * DrugInfoCard.js
 * Displays core drug details on the public verification page.
 * Props: drug (object), drugID (string)
 */
function DrugInfoCard({ drug, drugID }) {
  if (!drug) return null;

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const d = new Date(Number(ts) * 1000);
    return isNaN(d.getTime()) ? ts : d.toDateString();
  };

  const statusColor = {
    Active:   "#166534",
    ACTIVE:   "#166534",
    Expired:  "#92400e",
    EXPIRED:  "#92400e",
    Recalled: "#991b1b",
    RECALLED: "#991b1b",
  };

  const color = statusColor[drug.status] || "#374151";

  return (
    <div className="card">
      <h2>Drug Information</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <tbody>
          {[
            ["Drug ID",      drug.drugID    || drugID],
            ["Name",         drug.name      || "N/A"],
            ["Batch Number", drug.batchNumber || "N/A"],
            ["Manufacturer", drug.manufacturer || drug.currentOwner || "N/A"],
            ["Expiry Date",  formatDate(drug.expiryDate || drug.expiryTimestamp)],
            ["Current Owner", drug.currentOwner || "N/A"],
          ].map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px 8px", fontWeight: "600", color: "#555", width: "40%", fontSize: "13px" }}>
                {label}
              </td>
              <td style={{ padding: "10px 8px", color: "#333", fontSize: "13px", wordBreak: "break-all" }}>
                {value}
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: "10px 8px", fontWeight: "600", color: "#555", fontSize: "13px" }}>Status</td>
            <td style={{ padding: "10px 8px" }}>
              <span style={{
                background: color === "#166534" ? "#dcfce7" : color === "#92400e" ? "#fef3c7" : "#fee2e2",
                color,
                padding: "3px 10px",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "12px",
              }}>
                {drug.status || "UNKNOWN"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DrugInfoCard;
