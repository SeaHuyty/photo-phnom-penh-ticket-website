import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import EventSelection from "./components/EventSelection";
import CreateQr from "./components/CreateQr";
import BankQRCode from "./components/BankQrCode";
import ThankYou from "./components/ThankYou";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashBoard";
import ScanQr from "./components/ScanQr";
import AdminPage from "./components/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Router>
      <div>
        <h1>Welcome to Tuk Tuk Tour Ticket System</h1>
        <Routes>
          <Route path="/" element={<EventSelection />} />
          <Route path="/create-qr/:eventId" element={<CreateQr />} />
          <Route path="/bank-qrcode" element={<BankQRCode />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/login" element={<Login />} />
          <Route 
              path="/admin"
              element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
          />
          <Route 
              path="/scan" 
              element={<ProtectedRoute><ScanQr /></ProtectedRoute>} 
          />
          <Route 
              path="/send-email" 
              element={<ProtectedRoute><AdminPage /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;