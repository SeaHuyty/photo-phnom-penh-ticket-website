import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";

// QR Code Security Functions
const QR_SECRET_KEY = "phnom-penh-festival-qr-secret-2024"; // Should match backend

const hashQRData = (originalData) => {
  try {
    // Create a hash of the original QR code data
    const hash = CryptoJS.HmacSHA256(originalData, QR_SECRET_KEY).toString();
    return hash;
  } catch (error) {
    console.error('Error hashing QR data:', error);
    return originalData; // Fallback to original data
  }
};

const decodeQRData = (hashedData) => {
  // Note: HMAC is one-way, so we can't decode it back to original
  // The backend will need to hash the original data and compare
  return hashedData;
};

function AdminNewPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [eventCounts, setEventCounts] = useState({});
  const [eventsMap, setEventsMap] = useState({});
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
    quantity: 1
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, eventsResponse] = await Promise.all([
          axios.get("http://localhost:3000/api/users"),
          axios.get("http://localhost:3000/api/events")
        ]);
        
        const userData = usersResponse.data;
        const eventsData = eventsResponse.data;
        
        setUsers(userData);
        setFilteredUsers(userData);
        setEvents(eventsData);
        
        // Calculate event counts and create events mapping
        const counts = {};
        const eventsMapping = {};
        
        userData.forEach(user => {
          const eventId = String(user.eventId || 'Unknown');
          const eventName = user.event?.name || 'Unknown Event';
          
          counts[eventId] = (counts[eventId] || 0) + 1;
          eventsMapping[eventId] = eventName;
        });
        
        setEventCounts(counts);
        setEventsMap(eventsMapping);
        
        // Group users by purchaser email
        const grouped = groupUsersByPurchaser(userData);
        setGroupedUsers(grouped);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    if (selectedEvent !== "all") {
      filtered = users.filter(user => String(user.eventId) === String(selectedEvent));
    }
    
    setFilteredUsers(filtered);
    
    // Update grouped users based on filtered data
    const grouped = groupUsersByPurchaser(filtered);
    setGroupedUsers(grouped);
  }, [selectedEvent, users]);

  const groupUsersByPurchaser = (usersData) => {
    const grouped = {};
    
    usersData.forEach(user => {
      const key = user.purchaserEmail || user.email;
      
      if (!grouped[key]) {
        grouped[key] = {
          purchaserEmail: key,
          name: user.name.replace(/ \(Ticket \d+\)$/, ''), // Remove ticket suffix
          email: user.email,
          phone: user.phone,
          event: user.event,
          eventId: user.eventId,
          tickets: [],
          totalTickets: 0
        };
      }
      
      grouped[key].tickets.push({
        id: user.id,
        qrCode: user.qrCode,
        ticketNumber: user.ticketNumber || 1,
        used: user.used,
        scannedAt: user.scannedAt
      });
      grouped[key].totalTickets++;
    });
    
    return Object.values(grouped);
  };

  const handleEventFilter = (eventId) => {
    setSelectedEvent(eventId);
  };

  const handleGenerateQRCode = async (userQrCode) => {
    try {
      // Hash the QR code data before generating
      const hashedQRData = hashQRData(userQrCode);
      const canvas = document.getElementById(`qrCanvas-${userQrCode}`);
      if (canvas) {
        const imageUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `qrCode-${userQrCode}.png`;
        link.click();
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleDownloadAllQRCodes = async (groupedUser) => {
    try {
      if (groupedUser.tickets.length === 1) {
        // Single ticket - use existing download
        handleGenerateQRCode(groupedUser.tickets[0].qrCode);
        return;
      }

      // Multiple tickets - create ZIP file with QR codes
      const zip = new JSZip();
      const qrFolder = zip.folder(`${groupedUser.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_QR_Codes`);
      
      // Add ticket information file
      let ticketInfo = `QR Codes for: ${groupedUser.name}\n`;
      ticketInfo += `Email: ${groupedUser.email}\n`;
      ticketInfo += `Total Tickets: ${groupedUser.tickets.length}\n`;
      ticketInfo += `Generated: ${new Date().toLocaleString()}\n\n`;
      ticketInfo += `Ticket Details:\n`;
      ticketInfo += `================\n`;
      
      // Process each ticket
      for (let i = 0; i < groupedUser.tickets.length; i++) {
        const ticket = groupedUser.tickets[i];
        
        // Add ticket info to summary
        ticketInfo += `\nTicket ${i + 1}:\n`;
        ticketInfo += `  - ID: ${ticket.id}\n`;
        ticketInfo += `  - Ticket Number: ${ticket.ticketNumber || 'N/A'}\n`;
        ticketInfo += `  - QR Code: ${ticket.qrCode}\n`;
        ticketInfo += `  - Event: ${ticket.event?.name || 'Unknown'}\n`;
        ticketInfo += `  - Scanned: ${ticket.scannedAt ? 'Yes' : 'No'}\n`;
        
        try {
          // Generate QR code using canvas (browser-compatible)
          const canvas = document.createElement('canvas');
          const size = 300;
          canvas.width = size;
          canvas.height = size;
          
          // Hash the QR code data before generating
          const hashedQRData = hashQRData(ticket.qrCode);
          
          // Use QRCode library to generate to canvas with hashed data
          await QRCode.toCanvas(canvas, hashedQRData, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          // Convert canvas to blob
          const qrImageBlob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          const fileName = `ticket_${String(i + 1).padStart(2, '0')}_${ticket.ticketNumber || ticket.id}.png`;
          qrFolder.file(fileName, qrImageBlob);
          
        } catch (qrError) {
          console.warn(`Failed to generate QR for ticket ${i + 1}:`, qrError);
          // Create a text file as fallback
          const fileName = `ticket_${String(i + 1).padStart(2, '0')}_${ticket.ticketNumber || ticket.id}.txt`;
          const fallbackContent = `QR Code Data: ${ticket.qrCode}\nTicket ID: ${ticket.id}\nUser: ${ticket.name}\nEvent: ${ticket.event?.name || 'Unknown'}`;
          qrFolder.file(fileName, fallbackContent);
        }
      }
      
      // Add ticket information file to ZIP
      qrFolder.file('ticket_info.txt', ticketInfo);
      
      // Wait a moment for all files to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      const fileName = `${groupedUser.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_${groupedUser.tickets.length}_QR_Codes.zip`;
      saveAs(content, fileName);
      
      console.log(`Successfully created ZIP file with ${groupedUser.tickets.length} QR codes for ${groupedUser.name}`);
      alert(`Successfully downloaded ${groupedUser.tickets.length} QR codes as ZIP file for ${groupedUser.name}!`);
      
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      
      // Fallback to individual downloads
      alert(`Creating ZIP failed. Downloading individual QR codes...`);
      for (let i = 0; i < groupedUser.tickets.length; i++) {
        setTimeout(() => {
          handleGenerateQRCode(groupedUser.tickets[i].qrCode);
        }, i * 300); // Stagger downloads
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    
    try {
      const response = await axios.post("http://localhost:3000/api/register", {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        eventId: parseInt(newUser.eventId),
        quantity: parseInt(newUser.quantity)
      });
      
      // Refresh users data
      const usersResponse = await axios.get("http://localhost:3000/api/users");
      const userData = usersResponse.data;
      setUsers(userData);
      setFilteredUsers(userData);
      
      // Update counts and mapping
      const counts = {};
      const eventsMapping = {};
      
      userData.forEach(user => {
        const eventId = user.eventId || 'Unknown';
        const eventName = user.event?.name || 'Unknown Event';
        
        counts[eventId] = (counts[eventId] || 0) + 1;
        eventsMapping[eventId] = eventName;
      });
      
      setEventCounts(counts);
      setEventsMap(eventsMapping);
      
      // Update grouped users
      const grouped = groupUsersByPurchaser(userData);
      setGroupedUsers(grouped);
      
      // Reset form and close modal
      setNewUser({ name: '', email: '', phone: '', eventId: '', quantity: 1 });
      setShowCreateModal(false);
      
      const ticketWord = response.data.totalTickets > 1 ? 'tickets' : 'ticket';
      alert(`Successfully created ${response.data.totalTickets} ${ticketWord} for ${newUser.name}!`);
    } catch (error) {
      console.error("Error creating user:", error);
      alert('Error creating user: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewUser({ name: '', email: '', phone: '', eventId: '', quantity: 1 });
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  const uniqueEvents = [...new Set(users.map(user => String(user.eventId)))];
  const totalUsers = users.length;

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <h1>User Management</h1>
          <p className="total-users">
            Total Registered Users: <span className="count">{totalUsers}</span>
          </p>
        </div>
        <div className="header-right">
          <button 
            className="create-user-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New User
          </button>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-controls">
          <label htmlFor="event-filter">Filter by Event:</label>
          <select 
            id="event-filter"
            value={selectedEvent} 
            onChange={(e) => handleEventFilter(e.target.value)}
            className="event-filter-dropdown"
          >
            <option value="all">All Events</option>
            {uniqueEvents.map((eventId) => (
              <option key={eventId} value={String(eventId)}>
                {eventsMap[eventId] || 'Unknown Event'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="current-filter-info">
          <span className="filter-label">Showing:</span>
          <span className="filter-count">{groupedUsers.length} purchasers ({filteredUsers.length} total tickets)</span>
          {selectedEvent !== "all" && (
            <button 
              onClick={() => handleEventFilter("all")} 
              className="clear-filter-btn"
            >
              Clear Filter ✕
            </button>
          )}
        </div>
      </div>

      {groupedUsers.length === 0 ? (
        <div className="no-users-message">
          <p>No users found for the selected filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Event</th>
                <th>Tickets</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedUsers.map((groupedUser, index) => (
                <tr key={groupedUser.purchaserEmail}>
                  <td className="row-number">{index + 1}</td>
                  <td className="user-name">{groupedUser.name}</td>
                  <td className="user-email">{groupedUser.email}</td>
                  <td className="user-phone">{groupedUser.phone}</td>
                  <td className="user-event">{groupedUser.event?.name || 'Unknown Event'}</td>
                  <td className="tickets-count">
                    <span className="ticket-badge">
                      {groupedUser.totalTickets} {groupedUser.totalTickets === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </td>
                  <td className="user-actions">
                    <button
                      onClick={() => handleDownloadAllQRCodes(groupedUser)}
                      className="download-qr-btn"
                      title={groupedUser.totalTickets > 1 ? `Download ${groupedUser.totalTickets} QR codes` : 'Download QR code'}
                    >
                      {groupedUser.totalTickets > 1 ? 'Download All' : 'Download QR'}
                    </button>
                    {/* Hidden QR canvases for download generation */}
                    <div className="qr-container" style={{display: 'none'}}>
                      {groupedUser.tickets.map((ticket) => (
                        <QRCodeCanvas
                          key={ticket.id}
                          id={`qrCanvas-${ticket.qrCode}`}
                          value={hashQRData(ticket.qrCode)}
                          size={300}
                          includeMargin={true}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New User</h2>
              <button 
                className="modal-close-btn"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="create-user-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventId">Event *</label>
                <select
                  id="eventId"
                  name="eventId"
                  value={newUser.eventId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Number of Tickets *</label>
                <select
                  id="quantity"
                  name="quantity"
                  value={newUser.quantity}
                  onChange={handleInputChange}
                  required
                >
                  <option value={1}>1 Ticket</option>
                  <option value={2}>2 Tickets</option>
                  <option value={3}>3 Tickets</option>
                  <option value={4}>4 Tickets</option>
                  <option value={5}>5 Tickets</option>
                  <option value={6}>6 Tickets</option>
                  <option value={7}>7 Tickets</option>
                  <option value={8}>8 Tickets</option>
                  <option value={9}>9 Tickets</option>
                  <option value={10}>10 Tickets</option>
                </select>
                <small className="form-help">
                  All tickets will have the same contact information but unique QR codes
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .user-management-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .header-left h1 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .header-left .total-users {
          margin: 0;
          color: #666;
        }

        .header-left .count {
          font-weight: bold;
          color: #007bff;
        }

        .create-user-btn {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .create-user-btn:hover {
          background-color: #218838;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          color: #333;
        }

        .create-user-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .form-help {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .cancel-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-btn:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .submit-btn {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .cancel-btn:disabled,
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ticket-badge {
          display: inline-block;
          background-color: #e7f3ff;
          color: #0066cc;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #b3d9ff;
        }

        .tickets-count {
          text-align: center;
        }

        @media (max-width: 768px) {
          .user-management-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
          
          .modal-content {
            width: 95%;
            margin: 10px;
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminNewPage;
