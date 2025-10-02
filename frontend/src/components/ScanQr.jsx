import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const decodeHashedQR = (hashedData) => {
  // Since HMAC is one-way, we send the hashed data to backend
  // Backend will hash original QR codes and compare with this hash
  return hashedData;
};

function ScanQr() {
  const [scanResult, setScanResult] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(false); // Start with scanning disabled
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(localStorage.getItem('selectedEventId') || '');
  const [isConfiguring, setIsConfiguring] = useState(true);
  const scannerRef = useRef(null);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Scanner effect
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

  // Fetch available events
  async function fetchEvents() {
    try {
      const response = await axios.get(`${BASE_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setVerificationMessage("Error loading events");
    }
  }

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

  // Handle event selection
  function handleEventSelect(eventId) {
    setSelectedEventId(eventId);
    localStorage.setItem('selectedEventId', eventId);
  }

  // Start scanning with selected event
  function startScanning() {
    if (!selectedEventId) {
      setVerificationMessage("Please select an event first");
      return;
    }
    setIsConfiguring(false);
    setIsScanning(true);
    setVerificationMessage(null);
  }

  // Go back to configuration
  function goBackToConfig() {
    setIsScanning(false);
    setIsConfiguring(true);
    setScanResult(null);
    setVerificationMessage(null);
  }

  // In ScanQr.jsx, send the hashed QR code content to the server
  async function sendToServer(scannedQRCode) {
    try {
        // The scanned QR code is already hashed, so we send it as is
        const decodedQR = decodeHashedQR(scannedQRCode);

        const response = await axios.post(`${BASE_URL}/verify`, {
          qrCode: decodedQR,
          isHashed: true, // Flag to let backend know this is a hashed QR code
          selectedEventId: selectedEventId // Include selected event for validation
        });
        setVerificationMessage(response.data.message);

        if (response.data.message === "QR Code already used" || response.data.message.includes("Wrong event")) {
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
      <h1 className="text-2xl font-bold text-gray-700">QR Code Scanner</h1>

      {/* Event Configuration */}
      {isConfiguring && (
        <div style={styles.configContainer}>
          <h2>Scanner Configuration</h2>
          <p>Select the event you want to scan tickets for:</p>
          
          <div style={styles.eventSelection}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventOption}>
                <label style={styles.eventLabel}>
                  <input
                    type="radio"
                    name="event"
                    value={event.id}
                    checked={selectedEventId == event.id}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    style={styles.radio}
                  />
                  <span className="font-medium text-gray-800">{event.name}</span>
                </label>
              </div>
            ))}
          </div>

          <div style={styles.buttonContainer}>
            <button 
              onClick={startScanning} 
              disabled={!selectedEventId}
              style={{
                ...styles.button,
                backgroundColor: selectedEventId ? '#4CAF50' : '#cccccc',
                cursor: selectedEventId ? 'pointer' : 'not-allowed'
              }}
            >
              Start Scanning
            </button>
          </div>

          {verificationMessage && (
            <div style={styles.errorMessage}>
              {verificationMessage}
            </div>
          )}
        </div>
      )}

      {/* Scanner View */}
      {!isConfiguring && (
        <div>
          <div style={styles.scannerHeader}>
            <h2>Scanning for: {events.find(e => e.id == selectedEventId)?.name}</h2>
            <button onClick={goBackToConfig} style={styles.configButton} className="cursor-pointer bg-[#bc2649] text-white hover:bg-[#a61e3a]">
              ⚙️ Configure Scanner
            </button>
          </div>

          {/* Scanner container */}
          <div
            id="reader"
            style={{
              width: "100%",
              height: "400px",
              display: "inline-block",
            }}
          ></div>

          {/* Pop-up for status */}
          {scanResult && (
            <div style={styles.popup}>
              <h2>Status: {verificationMessage || "Scanning..."}</h2>
              <button onClick={resetScan} style={styles.button}>
                Scan Next
              </button>
              <button onClick={goBackToConfig} style={{...styles.button, marginLeft: '10px'}}>
                Configure
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Styles for the components
const styles = {
  configContainer: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    margin: "20px auto",
    textAlign: "center",
  },
  eventSelection: {
    margin: "20px 0",
    textAlign: "left",
  },
  eventOption: {
    margin: "10px 0",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9",
  },
  eventLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "16px",
  },
  radio: {
    marginRight: "10px",
    transform: "scale(1.2)",
  },
  eventName: {
    fontWeight: "bold",
    marginRight: "10px",
  },
  eventCode: {
    color: "#666",
    fontSize: "14px",
  },
  buttonContainer: {
    marginTop: "20px",
  },
  scannerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px",
    margin: "10px 0",
  },
  configButton: {
    padding: "8px 16px",
    fontSize: "14px",
    border: "none",
    borderRadius: "5px",
  },
  errorMessage: {
    color: "red",
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#ffe6e6",
    borderRadius: "5px",
  },
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
    textAlign: "center",
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
