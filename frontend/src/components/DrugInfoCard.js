import React from "react";

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  try {
    const date = new Date(
      typeof value === "number" && value < 100000000000
        ? value * 1000
        : value
    );

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString();
  } catch {
    return "N/A";
  }
}

function DrugInfoCard({ drug, drugID }) {
  if (!drug) {
    return null;
  }

  return (
    <div className="card">
      <h2>Drug Information</h2>

      <p>
        <strong>Drug ID:</strong>{" "}
        {drug.drugID || drugID || "N/A"}
      </p>

      <p>
        <strong>Name:</strong>{" "}
        {drug.name || "N/A"}
      </p>

      <p>
        <strong>Batch Number:</strong>{" "}
        {drug.batchNumber || drug.batch || "N/A"}
      </p>

      <p>
        <strong>Manufacturer:</strong>{" "}
        {drug.manufacturer ||
          drug.manufacturerName ||
          "N/A"}
      </p>

      <p>
        <strong>Expiry Date:</strong>{" "}
        {formatDate(drug.expiryDate)}
      </p>

      {drug.status && (
        <p>
          <strong>Status:</strong>{" "}
          {String(drug.status).toUpperCase()}
        </p>
      )}

      {drug.currentOwner && (
        <p>
          <strong>Current Owner:</strong>{" "}
          {drug.currentOwner}
        </p>
      )}
    </div>
  );
}

export default DrugInfoCard;


