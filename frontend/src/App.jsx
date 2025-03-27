import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import EventSelection from "./components/EventSelection";
import CreateQr from "./components/CreateQr";
import BankQRCode from "./components/BankQrCode";
import ThankYou from "./components/ThankYou";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ScanQr from "./components/ScanQr";
import AdminPage from "./components/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import './App.css';

const App = () => {
  return (
    <Router>
      {/* //container to store */}
      <div className="container">
        {/* nav bar */}
        <nav className="navbar"> 
          <h1>Photo Phnom Penh</h1>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Service</a></li>
            <div className="contact">
              <li><a href="#">Contact</a></li>
            </div>
          </ul>
        </nav>
        <div className="app">
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
        <footer>
          <p>&copy; 2024 Photo-Phnom-Penh</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;