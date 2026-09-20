import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let mounted = true;
    let scanner = null;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();

        if (!mounted) return;

        if (!cameras || cameras.length === 0) {
          throw new Error("No camera found");
        }

        const backCamera = cameras.find((camera) =>
          camera.label.toLowerCase().includes("back")
        );

        const selectedCamera = backCamera || cameras[0];

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!mounted || scannedRef.current) return;

            scannedRef.current = true;

            let drugID = decodedText.trim();

            if (decodedText.includes("/verify/")) {
              drugID = decodedText.split("/verify/").pop();
            } else if (decodedText.includes("/")) {
              drugID = decodedText.split("/").filter(Boolean).pop();
            }

            try {
              drugID = decodeURIComponent(drugID).trim();
            } catch {
              drugID = drugID.trim();
            }

            if (drugID && onScanRef.current) {
              onScanRef.current(drugID);
            }

            if (runningRef.current) {
              scanner
                .stop()
                .then(() => {
                  runningRef.current = false;
                })
                .catch(() => {});
            }
          },
          () => {
            // Ignore scan errors
          }
        );

        if (mounted) {
          runningRef.current = true;
        }
      } catch (error) {
        if (mounted) {
          console.error("QR Scanner error:", error);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;

      const currentScanner = scannerRef.current;

      if (!currentScanner) return;

      const cleanup = async () => {
        try {
          if (runningRef.current) {
            await currentScanner.stop();
            runningRef.current = false;
          }
        } catch (error) {
          // Scanner may already be stopped
        }

        try {
          currentScanner.clear();
        } catch (error) {
          // Scanner may already be cleared
        }

        scannerRef.current = null;
      };

      cleanup();
    };
  }, []);

  return <div id="qr-reader"></div>;
};

export default QRScanner;