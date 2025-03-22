import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      alert("Please verify that you have paid for the ticket.");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Pay via this QR Code</h1>
      <div style={styles.qrContainer}>
        <img 
          src="/image.png"  // Replace with the actual path to your bank QR code image
          alt="Bank QR Code"
          style={styles.qrImage}
        />
      </div>

      <div style={styles.checkboxContainer}>
        <input
          type="checkbox" 
          checked={isChecked} 
          onChange={handleCheckboxChange} 
          id="payment-verification"
          style={styles.checkbox} 
        />
        <label htmlFor="payment-verification">I have paid for the ticket.</label>
      </div>

      <button 
        onClick={handleDoneClick} 
        style={styles.doneButton}
        disabled={!isChecked}  // Disable the button if checkbox is not checked
      >
        Done
      </button>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white",
  },
  qrContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "20px",
  },
  qrImage: {
    width: "450px", // Adjust the size of your QR code image
    height: "450px",
  },
  checkboxContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "25px",
  },
  checkbox: {
    transform: "scale(2)", // Make the checkbox bigger
    borderStyle: "none",
    borderRadius: "25px",
    marginRight: "15px",  
    cursor: "pointer",
  },
  doneButton: {
    borderRadius: "5px",
    borderStyle: "none",
    marginTop: "20px",
    padding: "10px 50px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default BankQRCode;