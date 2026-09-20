import React, { useState } from "react";
import { generateDrugQR } from "../services/api";

function QRGenerator({ drugID, token }) {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQR = async () => {
    if (!drugID || !drugID.trim()) {
      setError("Please provide a Drug ID.");
      return;
    }

    if (!token) {
      setError(
        "Wallet authentication is required to generate a QR code."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setQrCode("");

      const data = await generateDrugQR(
        drugID.trim(),
        token
      );

      const qr =
        data?.qrCode ||
        data?.qr ||
        data?.image ||
        data?.data;

      if (!qr) {
        throw new Error(
          "QR code was not returned by the server."
        );
      }

      setQrCode(qr);
    } catch (err) {
      console.error("QR generation error:", err);

      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to generate QR code."
      );
    } finally {
      setLoading(false);
    }
  };

  const getImageSource = (value) => {
    if (!value) {
      return "";
    }

    if (
      value.startsWith("data:image") ||
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    return `data:image/png;base64,${value}`;
  };

  return (
    <div className="card">
      <h2>Generate QR Code</h2>

      <p>
        Generate an authenticated QR code for:
      </p>

      <p>
        <strong>Drug ID:</strong>{" "}
        {drugID || "Not provided"}
      </p>

      <button
        onClick={handleGenerateQR}
        disabled={loading}
      >
        {loading
          ? "Generating QR..."
          : "Generate QR"}
      </button>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: "15px",
            padding: "10px",
            border: "1px solid #b91c1c",
            borderRadius: "6px",
          }}
        >
          {error}
        </p>
      )}

      {qrCode && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <h3>QR Code</h3>

          <img
            src={getImageSource(qrCode)}
            alt={`QR code for ${drugID}`}
            style={{
              maxWidth: "300px",
              width: "100%",
              height: "auto",
            }}
          />

          <p>
            Scan this QR code to verify the drug.
          </p>
        </div>
      )}
    </div>
  );
}

export default QRGenerator;

