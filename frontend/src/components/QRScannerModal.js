import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import QRScanner from "./QRScanner";

function QRScannerModal({ isOpen, onScan, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#000",
          borderRadius: "12px",
          padding: "20px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h2
            id="qr-scanner-title"
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            Scan Drug QR Code
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR scanner"
            style={{
              border: "none",
              borderRadius: "8px",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            margin: "8px 0 12px",
            fontSize: "14px",
          }}
        >
          Point your camera at the drug QR code.
        </p>

        <div
          style={{
            width: "100%",
            height: "360px",
            minHeight: "360px",
            overflow: "hidden",
            borderRadius: "8px",
            background: "#000",
            position: "relative",
          }}
        >
          <QRScanner onScan={onScan} />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "12px",
            width: "100%",
            height: "40px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default QRScannerModal;