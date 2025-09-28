import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

function ScanQr() {
  const [scanResult, setScanResult] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      // Only create scanner if we're scanning and don't have one already
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: 500,
        fps: 5,
      });
      
      scannerRef.current = scanner;
      scanner.render(handleScanSuccess, handleScanError);
    }

    return () => {
      // Clean up scanner when component unmounts or when stopping
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Error clearing scanner:", err));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  // Handle successful scan
  function handleScanSuccess(result) {
    const qrCode = result;
    setScanResult(qrCode);
    
    // Stop scanning immediately to prevent multiple scans
    setIsScanning(false);
    
    // Clear the scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Error clearing scanner:", err));
      scannerRef.current = null;
    }
    
    // Send to server
    sendToServer(qrCode);
  }

  // Handle scan errors
  function handleScanError(err) {
    // Only log warnings, don't spam the console
    if (err && !err.includes("No MultiFormat Readers")) {
      console.warn("Scan error:", err);
    }
  }

  // Function to play sound feedback
  function playBeep() {
    const beep = new Audio("/beep.mp3");
    beep.play();
  }

  // Function to display error sound feedback
  function playErrorBeep() {
    const beep = new Audio("/errorNotBeep.mp3");
    beep.play();
  }

  // In ScanQr.jsx, send the QR code content to the server instead of userId
  async function sendToServer(qrCode) {
    try {
        const response = await axios.post("http://localhost:3000/api/verify", { qrCode });
        setVerificationMessage(response.data.message);

        if (response.data.message === "QR Code already used") {
            playErrorBeep();
        } else {
            playBeep();
        }
    } catch (error) {
        setVerificationMessage(error.response?.data?.message || "Verification failed");
        playErrorBeep();
    }
  }

  // Function to reset scan and pop-up
  function resetScan() {
    setScanResult(null);
    setVerificationMessage(null);
    
    // Clear the scanner div content before restarting
    const readerElement = document.getElementById("reader");
    if (readerElement) {
      readerElement.innerHTML = "";
    }
    
    // Restart scanning
    setIsScanning(true);
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
