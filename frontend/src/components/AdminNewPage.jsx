import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

function AdminNewPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [eventCounts, setEventCounts] = useState({});
  const [eventsMap, setEventsMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/users");
        const userData = response.data;
        setUsers(userData);
        setFilteredUsers(userData);
        
        // Calculate event counts and create events mapping
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
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedEvent === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.eventId === selectedEvent));
    }
  }, [selectedEvent, users]);

  const handleEventFilter = (eventId) => {
    setSelectedEvent(eventId);
  };

  const handleGenerateQRCode = async (userQrCode) => {
    try {
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

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  const uniqueEvents = [...new Set(users.map(user => user.eventId))];
  const totalUsers = users.length;

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p className="total-users">
          Total Registered Users: <span className="count">{totalUsers}</span>
        </p>
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
              <option key={eventId} value={eventId}>
                {eventsMap[eventId] || 'Unknown Event'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="current-filter-info">
          <span className="filter-label">Showing:</span>
          <span className="filter-count">{filteredUsers.length} users</span>
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

      {filteredUsers.length === 0 ? (
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td className="row-number">{index + 1}</td>
                  <td className="user-name">{user.name}</td>
                  <td className="user-email">{user.email}</td>
                  <td className="user-phone">{user.phone}</td>
                  <td className="user-event">{user.event?.name || 'Unknown Event'}</td>
                  <td className="user-actions">
                    <button
                      onClick={() => handleGenerateQRCode(user.qrCode)}
                      className="download-qr-btn"
                    >
                      Download QR
                    </button>
                    <div className="qr-container">
                      <QRCodeCanvas
                        id={`qrCanvas-${user.qrCode}`}
                        value={user.qrCode}
                        size={300}
                        includeMargin={true}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminNewPage;
