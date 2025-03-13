import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function CreateQr() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/register", { ...formData, eventId });
      navigate("/bank-qrcode");  // Redirect to the page with your bank QR code
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting data");
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Create QR Code</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="Phone" onChange={handleChange} required />
        <button type="submit">Next</button>
      </form>
    </div>
  );
}

export default CreateQr;