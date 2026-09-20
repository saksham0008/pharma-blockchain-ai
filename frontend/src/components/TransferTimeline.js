import React from "react";

function formatTimestamp(value) {
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

    return date.toLocaleString();
  } catch {
    return "N/A";
  }
}

function TransferTimeline({ transfers = [] }) {
  if (!Array.isArray(transfers) || transfers.length === 0) {
    return (
      <div className="card">
        <h2>Transfer History</h2>
        <p>No transfer history is available.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Transfer History</h2>

      <div className="transfer-timeline">
        {transfers.map((transfer, index) => (
          <div
            key={transfer.id || transfer.txHash || index}
            className="transfer-item"
            style={{
              position: "relative",
              paddingLeft: "25px",
              paddingBottom: "20px",
              marginBottom: "10px",
              borderLeft:
                index !== transfers.length - 1
                  ? "2px solid #ccc"
                  : "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "-7px",
                top: "0",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#333",
              }}
            />

            <h3>
              Transfer #{index + 1}
            </h3>

            {transfer.from && (
              <p>
                <strong>From:</strong>{" "}
                {transfer.from}
              </p>
            )}

            {transfer.to && (
              <p>
                <strong>To:</strong>{" "}
                {transfer.to}
              </p>
            )}

            {transfer.timestamp && (
              <p>
                <strong>Date:</strong>{" "}
                {formatTimestamp(
                  transfer.timestamp
                )}
              </p>
            )}

            {transfer.latitude !== undefined &&
              transfer.longitude !== undefined && (
                <p>
                  <strong>Location:</strong>{" "}
                  {transfer.latitude},{" "}
                  {transfer.longitude}
                </p>
              )}

            {transfer.txHash && (
              <p>
                <strong>Transaction:</strong>{" "}
                {transfer.txHash}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransferTimeline;

