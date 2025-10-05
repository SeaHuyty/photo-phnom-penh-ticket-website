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
  const [userInfo, setUserInfo] = useState(null); // Store user info from successful scan
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
    const beep = new Audio("/errorBeep.m4a");
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
    setUserInfo(null); // Clear user info
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
        
        // Store user info if scan was successful
        if (response.data.user) {
          setUserInfo(response.data.user);
        }

        if (response.data.message === "QR Code already used" || response.data.message.includes("Wrong event")) {
            playErrorBeep();
        } else {
            playBeep();
        }
    } catch (error) {
        setVerificationMessage(error.response?.data?.message || "Verification failed");
        setUserInfo(null); // Clear user info on error
        playErrorBeep();
    }
  }

  // Function to reset scan and pop-up
  function resetScan() {
    setScanResult(null);
    setVerificationMessage(null);
    setUserInfo(null); // Clear user info
    
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
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-[600px] my-5 mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Scanner Configuration</h2>
          <p>Select the event you want to scan tickets for:</p>
          
          <div className="mt-6">
            {events.map((event) => (
              <div key={event.id} className="border border-[#ddd] p-4 rounded-lg mb-4 hover:shadow-md transition duration-300 cursor-pointer">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="event"
                    value={event.id}
                    checked={selectedEventId == event.id}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    className="mr-2 transform scale-125 cursor-pointer"
                  />
                  <span className="font-medium text-gray-800">{event.name}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button 
              onClick={startScanning} 
              disabled={!selectedEventId}
              className={`mt-4 px-6 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-80 ${selectedEventId ? 'bg-[#4CAF50]' : 'bg-[#cccccc] cursor-not-allowed'}`}
            >
              Start Scanning
            </button>
          </div>

          {verificationMessage && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded">
              {verificationMessage}
            </div>
          )}
        </div>
      )}

      {/* Scanner View */}
      {!isConfiguring && (
        <div>
          <div className="flex justify-between items-center px-4 py-2 bg-gray-200 rounded shadow mx-auto mt-5">
            <h2>Scanning for: {events.find(e => e.id == selectedEventId)?.name}</h2>
            <button onClick={goBackToConfig} className="cursor-pointer bg-[#bc2649] text-white hover:bg-[#a61e3a] px-4 py-2 rounded">
              ⚙️ Configure Scanner
            </button>
          </div>

          {/* Scanner container */}
          <div
            id="reader"
            className="w-[100%] h-[400px] inline-block relative"
          ></div>

          {/* Pop-up for status */}
          {scanResult && (
            <div className="absolute top-[50%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] bg-white p-6 border border-gray-300 rounded-lg shadow-lg text-center z-[1000] max-w-[400px]">
              <h2 className="text-lg font-semibold mb-3">Status: {verificationMessage || "Scanning..."}</h2>
              
              {/* Display user information if scan was successful */}
              {userInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-semibold text-green-800 mb-2">Ticket Information:</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name: </span>
                      <span className="text-gray-900">{userInfo.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Event: </span>
                      <span className="text-gray-900">{userInfo.event}</span>
                    </div>
                    {userInfo.other && (
                      <div>
                        <span className="font-medium text-gray-700">Other Info: </span>
                        <span className="text-gray-900">{userInfo.other}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <button onClick={resetScan} className="px-6 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-80 bg-[#007bff]">
                  Scan Next
                </button>
                <button onClick={goBackToConfig} className="px-6 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-80 bg-[#6c757d]">
                  Configure
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScanQr;
