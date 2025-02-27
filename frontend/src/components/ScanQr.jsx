import React, { useEffect, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

function ScanQr() {
  const [scanResult, setScanResult] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [manualUserId, setManualUserId] = useState("");

  useEffect(() => {
    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      console.error("Scanner element not found!");
      return;
    }

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(handleScanSuccess, handleScanError);

    return () => {
      scanner.clear();
    };
  }, []);

  // ✅ Handle successful scan
  function handleScanSuccess(result) {
    console.log("Scanned QR Code:", result); // ✅ Debugging
    setScanResult(result.trim());
    sendToServer(result.trim());
  }

  // 🔴 Handle scan errors
  function handleScanError(err) {
    console.warn("Scan error:", err);
  }

  // ✅ Send scanned User ID to backend
  async function sendToServer(userId) {
    if (!userId) {
      setVerificationMessage("Invalid QR Code");
      return;
    }

    console.log("Sending User ID to server:", userId); // ✅ Debugging
    try {
      const response = await axios.post("http://localhost:3000/api/verify", { userId });
      setVerificationMessage(response.data.message);
    } catch (error) {
      console.error("API Error:", error.response?.data); // ✅ Debugging
      setVerificationMessage(error.response?.data?.message || "Verification failed");
    }
  }

  // ✅ Handle manual input
  function handleManualInput(event) {
    setManualUserId(event.target.value);
  }

  function handleManualSubmit() {
    if (manualUserId) {
      sendToServer(manualUserId);
    }
  }

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <div id="reader"></div> {/* ✅ Ensure this element exists */}

      {scanResult && <p>Scanned User ID: {scanResult}</p>}
      
      {verificationMessage && <p>{verificationMessage}</p>}

      <div>
        <p>Or enter the User ID manually:</p>
        <input
          type="text"
          value={manualUserId}
          onChange={handleManualInput}
        />
        <button onClick={handleManualSubmit}>Verify</button>
      </div>
    </div>
  );
}

export default ScanQr;