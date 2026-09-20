import React from "react";

function RecallBanner({ recalled, recallNotice }) {
  if (!recalled) {
    return null;
  }

  const notice =
    typeof recallNotice === "string"
      ? recallNotice
      : recallNotice?.message ||
        "Please do not use this drug. Contact the manufacturer or your healthcare provider for further instructions.";

  return (
    <div
      className="recall-banner"
      role="alert"
      style={{
        padding: "15px",
        marginBottom: "20px",
        border: "2px solid #b91c1c",
        borderRadius: "8px",
      }}
    >
      <h2>[RECALL] Drug Recall Notice</h2>

      <p>
        <strong>This drug has been recalled.</strong>
      </p>

      <p>{notice}</p>
    </div>
  );
}

export default RecallBanner;

