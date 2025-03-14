import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch registered users from the backend
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/users"); // Replace with your actual backend URL
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleGenerateQRCode = async (userQrCode) => {
    try {
      const canvas = document.getElementById(`qrCanvas-${userQrCode}`);
      if (canvas) {
        const imageUrl = canvas.toDataURL("image/png"); // Generate image URL
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `qrCode-${userQrCode}.png`; // Define download name
        link.click(); // Trigger the download
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>Admin Page - Registered Users</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Event</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.eventId}</td>
              <td>
                <button
                  onClick={() => handleGenerateQRCode(user.qrCode)}
                  style={styles.button}
                >
                  Download QR Code
                </button>
                <div style={styles.qrContainer}>
                  <QRCodeCanvas
                    id={`qrCanvas-${user.qrCode}`}
                    value={user.qrCode}
                    size={300} // Increased size for better resolution
                    includeMargin={true} // Adds a white border around the QR code
                    style={styles.qrCode}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
  },
  table: {
    width: "80%",
    margin: "0 auto",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
    marginRight: "10px",
  },
  qrContainer: {
    padding: "10px", // Adds extra spacing around the QR code
    backgroundColor: "white", // Ensures a clear white background
    display: "none",
    borderRadius: "8px", // Optional: Rounded edges
  },
  qrCode: {
    border: "1px solid #ddd",
  },
};

export default AdminPage;