import React from 'react';
import CreateQr from './components/CreateQr';
import ScanQr from './components/ScanQr';

const App = () => {
  return (
    <div>
      <h1>Welcome to Tuk Tuk Tour Ticket System</h1>
      <div className="row">
        <CreateQr />
        <ScanQr />
      </div>
    </div>
  );
};

export default App;