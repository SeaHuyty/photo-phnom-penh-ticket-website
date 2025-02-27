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
    const canvas = qrRef.current.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "qrcode.png";
      link.click();
    }
  }

  return (
    <div>
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
          <div ref={qrRef}>
            <QRCodeCanvas value={userId.toString()} size={200} />
          </div>
          <button onClick={downloadQrCode}>Download QR Code</button>
        </div>
      )}
    </div>
  );
}

export default CreateQr; 