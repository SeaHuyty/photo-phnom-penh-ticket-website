import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

function CreateQr() {
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const qrRef = useRef();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/api/register", formData);
      setUserId(response.data.userId);
      setMessage("QR Code Generated!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error generating QR Code");
    }
  }

  function downloadQrCode() {
    const qrCanvas = qrRef.current.querySelector("canvas");

    if (qrCanvas) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const borderSize = 30; // White border size
      const qrSize = qrCanvas.width; // Get QR code size
      const newSize = qrSize + borderSize * 2; // New total size with border

      // Create new canvas with extra space for the border
      canvas.width = newSize;
      canvas.height = newSize;

      // Fill background with white (border)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, newSize, newSize);

      // Draw the QR code on top of the white background
      ctx.drawImage(qrCanvas, borderSize, borderSize, qrSize, qrSize);

      // Download the new QR code with the white border
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "qrcode_with_border.png";
      link.click();
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Create QR Code</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="Phone" onChange={handleChange} required />
        <button type="submit">Generate QR Code</button>
      </form>

      {message && <p>{message}</p>}

      {userId && (
        <div>
          <h3>Your QR Code:</h3>
          <div ref={qrRef} style={{ padding: "20px", display: "inline-block", backgroundColor: "#ffffff" }}>
            <QRCodeCanvas
              value={userId.toString()}
              size={250} // QR Code size
              bgColor="#ffffff" // Ensures the QR code has a white background
              fgColor="#000000" // Black foreground
              level="H" // High error correction
            />
          </div>
          <br />
          <button onClick={downloadQrCode}>Download QR Code</button>
        </div>
      )}
    </div>
  );
}

export default CreateQr;