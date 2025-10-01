import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import eventImage from "../assets/poster1.jpg";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      await axios.post(`${BASE_URL}/register`, { ...formData, eventId });
      navigate("/bank-qrcode");  // Redirect to the page with your bank QR code
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting data");
    }
  }

  return (
    <div className="w-full flex flex-col justify-center items-center" >
      <div className="img">
        <img src={eventImage} alt="" className="rounded-lg w-[100%]" />
      </div>
      <h1 className="mt-7 text-bold text-2xl mb-5 text-white">Create QR Code</h1>
      <div className="w-[50%] flex justify-center items-center bg-white rounded-lg">
        <form onSubmit={handleSubmit} className="w-[100%] flex flex-col gap-5 p-5 mt-5 text-left">
          {/* add label */}
          <label htmlFor="">Name *</label>
          <input type="text" name="name" placeholder="Name" onChange={handleChange} required
            className="w-[100%] bg-[#BC2649] text-white p-4 rounded-lg placeholder-text-white focus:outline-none focus:border-none" />
          <label htmlFor="">Email *</label>
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required
            className="w-[100%] bg-[#BC2649] text-white p-4 rounded-lg placeholder-text-white focus:outline-none focus:border-none" />
          <label htmlFor="">Phone Number *</label>
          <input type="tel" name="phone" placeholder="Phone" onChange={handleChange} required
            className="w-[100%] bg-[#BC2649] text-white p-4 rounded-lg placeholder-text-white focus:outline-none focus:border-none" />
          <div className="flex justify-center">
            <button type="submit" className="mt-5 w-[50%] px-6 py-3 cursor-pointer rounded-lg transition duration-200 text-bold text-white bg-[#BC2649] hover:bg-[#BC2649]/80">Next</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQr;