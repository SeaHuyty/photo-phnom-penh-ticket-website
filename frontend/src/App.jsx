import React from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import EventSelection from "./components/EventSelection";
import CreateQr from "./components/CreateQr";
import BankQRCode from "./components/BankQrCode";
import ThankYou from "./components/ThankYou";
import Login from "./components/Login";
import AdminSidebar from "./components/AdminSidebar";
import ScanQr from "./components/ScanQr";
import AdminNewPage from "./components/AdminNewPage";
import AttendanceCheck from "./components/AttendanceCheck";
import ProtectedRoute from "./components/ProtectedRoute";
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route 
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminSidebar>
                <Routes>
                  <Route index element={<AdminNewPage />} />
                  <Route path="scan" element={<ScanQr />} />
                  <Route path="users" element={<AdminNewPage />} />
                  <Route path="attendance" element={<AttendanceCheck />} />
                </Routes>
              </AdminSidebar>
            </ProtectedRoute>
          }
        />
      </Routes>
    );
  }

  return (
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
        </Routes>
      </div>
      <footer>
        <p>&copy; 2024 Photo-Phnom-Penh</p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;