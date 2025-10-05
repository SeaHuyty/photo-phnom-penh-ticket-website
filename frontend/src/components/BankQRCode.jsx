import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

function BankQRCode() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const handleDoneClick = () => {
    if (isChecked) {
      // Redirect to Thank You page
      navigate("/thank-you");
    } else {
      toast.warning("Please verify that you have paid for the ticket.");
    }
  };

  return (
    <div className="text-center p-5 flex flex-col items-center">
      <h1 className="text-white">Pay via this QR Code</h1>
      <div className="flex justify-center items-center pt-5">
        <img 
          src="/image.png"  // Replace with the actual path to your bank QR code image
          alt="Bank QR Code"
          className="w-[450px] h-[450px]"
        />
      </div>

      <div className="mt-5 flex items-center justify-center text-1xl">
        <input
          type="checkbox" 
          checked={isChecked} 
          onChange={handleCheckboxChange} 
          id="payment-verification"
          className="rounded-lg mr-3 cursor-pointer scale-200"
        />
        <label htmlFor="payment-verification">I have paid for the ticket.</label>
      </div>

      <button 
        onClick={handleDoneClick} 
        className="bg-[#BC2649] text-white font-semibold hover:bg-[#BC2649]/80 cursor-pointer transform duration-200 hover:scale-103 mt-5 px-6 py-2 rounded-lg"
        disabled={!isChecked}  // Disable the button if checkbox is not checked
      >
        Done
      </button>
    </div>
  );
}

export default BankQRCode;