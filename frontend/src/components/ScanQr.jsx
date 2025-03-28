import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

function ScanQr() {
  const [scanResult, setScanResult] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(true); // To control continuous scanning

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: 500, // Size of the scanning area
      fps: 5, // Frames per second for scanning
    });

    if (isScanning) {
      // Render the scanner with success and error callbacks
      scanner.render(handleScanSuccess, handleScanError);
    } else {
      scanner.clear(); // Stop scanning
    }

    return () => {
      scanner.clear();
    };
  }, [isScanning]);

  // Handle successful scan
  function handleScanSuccess(result) {
    const qrCode = result; // Assuming the QR code content itself is the result
    setScanResult(qrCode);
    sendToServer(qrCode); // Send QR code to the server for verification
  }

  // Handle scan errors
  function handleScanError(err) {
    console.warn("Scan error:", err);
  }

  // Function to play sound feedback
  function playBeep() {
    const beep = new Audio("/beep.mp3"); // Ensure you have the sound file
    beep.play();
  }

  // Function to display error sound feedback
  function playErrorBeep() {
    const beep = new Audio("/errorNotBeep.mp3"); // Ensure you have the sound file
    beep.play();
  }

  // In ScanQr.jsx, send the QR code content to the server instead of userId
  async function sendToServer(qrCode) {
    try {
        const response = await axios.post("http://localhost:3000/api/verify", { qrCode });
        setVerificationMessage(response.data.message);

        if (response.data.message === "QR Code already used") {
            // Handle used QR code logic if necessary
            playErrorBeep();
        } else {
            playBeep(); // Play sound when verified
        }

        // Stop scanning after result is obtained
        setIsScanning(false);
    } catch (error) {
        setVerificationMessage(error.response?.data?.message || "Verification failed");
        setIsScanning(false); // Stop scanning on error
    }
  }

  // Function to reset scan and pop-up
  function resetScan() {
    setScanResult(null);
    setVerificationMessage(null);
    setIsScanning(true); // Restart the scanning process
  }

  return (
    <div>
      <h1>QR Code Scanner</h1>

      {/* Scanner container */}
      <div
        id="reader"
        style={{
          width: "100%",
          height: "100%",
          display: "inline-block",
        }}
      ></div>

      {/* Pop-up for status */}
      {scanResult && (
        <div style={styles.popup}>
          <h2>Status: {verificationMessage || "Scanning..."}</h2>
          <button onClick={resetScan} style={styles.button}>
            Reset Scan
          </button>
        </div>
      )}
    </div>
  );
}

// Styles for the pop-up
const styles = {
  popup: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "white",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  button: {
    padding: "10px 20px",
    marginTop: "20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ScanQr;
