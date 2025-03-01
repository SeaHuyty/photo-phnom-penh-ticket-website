import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import EventSelection from "./components/EventSelection";
import CreateQr from "./components/CreateQr";
import ScanQr from "./components/ScanQr";

const App = () => {
  return (
    <Router>
      <div>
        <h1>Welcome to Tuk Tuk Tour Ticket System</h1>
        <Routes>
          <Route path="/" element={<EventSelection />} />
          <Route path="/create-qr/:eventId" element={<CreateQr />} />
          <Route path="/scan" element={<ScanQr />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;