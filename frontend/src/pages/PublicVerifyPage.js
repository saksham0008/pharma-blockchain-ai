import React from "react";
import { useParams } from "react-router-dom";

import useDrug from "../hooks/useDrug";

import DrugInfoCard from "../components/DrugInfoCard";
import RiskBadge from "../components/RiskBadge";
import RecallBanner from "../components/RecallBanner";
import TransferTimeline from "../components/TransferTimeline";
import GPSMapView from "../components/GPSMapView";

function getStatus(drug) {
  if (!drug) {
    return "UNKNOWN";
  }

  if (drug.recalled) {
    return "RECALLED";
  }

  const status = String(drug.status || "").toUpperCase();

  if (status === "EXPIRED") {
    return "EXPIRED";
  }

  if (status === "RECALLED") {
    return "RECALLED";
  }

  return "ACTIVE";
}

function PublicVerifyPage() {
  const { drugID } = useParams();

  const {
    drug,
    loading,
    error,
  } = useDrug(drugID);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Verifying Drug...</h2>

          <p>
            Please wait while we check the blockchain records.
          </p>
        </div>
      </div>
    );
  }

  if (error || !drug) {
    return (
      <div className="container">
        <div className="card">
          <h2>Drug Verification Failed</h2>

          <p>
            {error || "Unable to verify this drug."}
          </p>

          <p>
            <strong>Drug ID:</strong>{" "}
            {drugID || "N/A"}
          </p>

          <p>
            Please check the Drug ID and try again.
          </p>
        </div>
      </div>
    );
  }

  const status = getStatus(drug);

  return (
    <div className="container">
      <div className="card">
        <h1>Drug Verification</h1>

        <h2>
          {status === "ACTIVE" && "[OK] Drug Verified"}
          {status === "EXPIRED" && "⏰ Drug Expired"}
          {status === "RECALLED" && "⚠️ Drug Recalled"}
        </h2>

        <p>
          <strong>Status:</strong>{" "}
          {status}
        </p>
      </div>

      <RecallBanner
        recalled={drug.recalled}
        recallNotice={drug.recallNotice}
      />

      <DrugInfoCard
        drug={drug}
        drugID={drugID}
      />

      <div className="card">
        <RiskBadge
          riskScore={drug.riskScore}
          riskCategory={drug.riskCategory}
        />
      </div>

      <TransferTimeline
        transfers={
          drug.transferHistory ||
          drug.transfers ||
          []
        }
      />

      <GPSMapView
        locations={
          drug.gpsPath ||
          drug.gpsHistory ||
          []
        }
      />

      <div
        className="card"
        style={{
          textAlign: "center",
          opacity: 0.7,
        }}
      >
        <p>
          Verification data retrieved from
          PharmaChain.
        </p>

        <p>
          No MetaMask connection is required
          for public verification.
        </p>
      </div>
    </div>
  );
}

export default PublicVerifyPage;


