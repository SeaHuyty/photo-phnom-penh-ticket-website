import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="AdminDashboard">
            <h2>Admin Dashboard</h2>
            <div className="adminButton">
                <button onClick={() => navigate("/scan")}>Scan QR Code</button>
                <button onClick={() => navigate("/send-email")}>Send Email</button>
            </div>
        </div>
    );
};

export default AdminDashboard;