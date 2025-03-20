import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h2>Admin Dashboard</h2>
            <button onClick={() => navigate("/scan")}>Scan QR Code</button>
            <button onClick={() => navigate("/send-email")}>Send Email</button>
        </div>
    );
};

export default AdminDashboard;