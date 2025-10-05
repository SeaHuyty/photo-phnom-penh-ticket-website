import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { toast } from 'react-toastify';

// QR Code Security Functions
const QR_SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY;

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

function AdminNewPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [eventsMap, setEventsMap] = useState({});
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
    quantity: 1,
    other: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, eventsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/users`),
          axios.get(`${BASE_URL}/events`)
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
      // Group by purchaser email + createdAt to separate different purchase sessions
      const purchaseDate = user.createdAt ? new Date(user.createdAt).toISOString() : 'unknown';
      const key = `${user.purchaserEmail || user.email}-${purchaseDate}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          purchaserEmail: user.purchaserEmail || user.email,
          purchaseDate: user.createdAt,
          name: user.name.replace(/ \(Ticket \d+\)$/, ''), // Remove ticket suffix
          email: user.email,
          phone: user.phone,
          event: user.event,
          eventId: user.eventId,
          tickets: [],
          totalTickets: 0,
          emailSent: user.emailSent || false,
          emailSentAt: user.emailSentAt || null
        };
      }
      
      // Update email status if any ticket has email sent
      if (user.emailSent) {
        grouped[key].emailSent = true;
        if (user.emailSentAt && (!grouped[key].emailSentAt || new Date(user.emailSentAt) > new Date(grouped[key].emailSentAt))) {
          grouped[key].emailSentAt = user.emailSentAt;
        }
      }
      
      grouped[key].tickets.push({
        id: user.id,
        qrCode: user.qrCode,
        ticketNumber: user.ticketNumber || 1,
        used: user.used,
        scannedAt: user.scannedAt,
        emailSent: user.emailSent || false,
        emailSentAt: user.emailSentAt || null
      });
      grouped[key].totalTickets++;
    });
    
    return Object.values(grouped);
  };

  const handleEventFilter = (eventId) => {
    setSelectedEvent(eventId);
  };

  const handleGenerateQRCode = async (userQrCode, userName, userId) => {
    try {
      const canvas = document.getElementById(`qrCanvas-${userQrCode}`);
      if (canvas) {
        const imageUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${userName}-${userId}.png`;
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
        handleGenerateQRCode(groupedUser.tickets[0].qrCode, groupedUser.name, groupedUser.tickets[0].id);
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
      toast.success(`Successfully downloaded ${groupedUser.tickets.length} QR codes as ZIP file for ${groupedUser.name}!`);
      
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      
      // Fallback to individual downloads
      toast.warning(`Creating ZIP failed. Downloading individual QR codes...`);
      for (let i = 0; i < groupedUser.tickets.length; i++) {
        setTimeout(() => {
          handleGenerateQRCode(groupedUser.tickets[i].qrCode);
        }, i * 300); // Stagger downloads
      }
    }
  };

  const handleSendEmail = async (groupedUser) => {
    try {
      // Add loading state to prevent multiple clicks
      const purchaserEmail = groupedUser.purchaserEmail;
      
      toast.info(`Sending email to ${purchaserEmail}...`);
      
      const response = await axios.post(`${BASE_URL}/admin/send-email`, {
        purchaserEmail: purchaserEmail,
        purchaseDate: groupedUser.purchaseDate
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.status === 200) {
        toast.success(`Email sent successfully to ${purchaserEmail} with ${response.data.totalTickets} QR code${response.data.totalTickets > 1 ? 's' : ''}!`);
        
        // Refresh data to update email status
        const [usersResponse, eventsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/users`),
          axios.get(`${BASE_URL}/events`)
        ]);
        
        const userData = usersResponse.data;
        setUsers(userData);
        setFilteredUsers(userData);
        
        // Update grouped users
        const grouped = groupUsersByPurchaser(userData);
        setGroupedUsers(grouped);
        
      } else if (response.status === 207) {
        // Partial success
        toast.warning(`Some emails sent successfully to ${purchaserEmail}. Check console for details.`);
        console.warn('Partial email success:', response.data);
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      
      if (error.response?.status === 400 && error.response?.data?.alreadySent) {
        toast.warning('Email has already been sent to this user.');
      } else if (error.response?.status === 404) {
        toast.error('No tickets found for this email address.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to send email. Please try again.';
        toast.error(`Email sending failed: ${errorMessage}`);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    
    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        eventId: parseInt(newUser.eventId),
        quantity: parseInt(newUser.quantity),
        other: newUser.other
      });
      
      // Refresh users data
      const usersResponse = await axios.get(`${BASE_URL}/users`);
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
      
      setEventsMap(eventsMapping);
      
      // Update grouped users
      const grouped = groupUsersByPurchaser(userData);
      setGroupedUsers(grouped);
      
      // Reset form and close modal
      setNewUser({ name: '', email: '', phone: '', eventId: '', quantity: 1 });
      setShowCreateModal(false);
      
      const ticketWord = response.data.totalTickets > 1 ? 'tickets' : 'ticket';
      toast.success(`Successfully created ${response.data.totalTickets} ${ticketWord} for ${newUser.name}!`);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error('Error creating user: ' + (error.response?.data?.message || 'Unknown error'));
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
    setNewUser({ name: '', email: '', phone: '', eventId: '', quantity: 1, other: '' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-4 h-[100vh] text-[#7f8c8d]">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  const uniqueEvents = [...new Set(users.map(user => String(user.eventId)))];
  const totalUsers = users.length;

  return (
    <div className="text-[#333333]">
      <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Ticket Management</h1>
          <p className="text-gray-500">
            Total Registered Tickets: <span className="font-bold text-[#007bff]">{totalUsers}</span>
          </p>
        </div>
        <div className="header-right">
          <button 
            className="bg-[#28a745] text-white font-semibold rounded cursor-pointer hover:bg-[#218838] px-4 py-2"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Ticket
          </button>
        </div>
      </div>

      <div className="bg-[#f8f9fa] p-4 rounded mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <label htmlFor="event-filter" className="text-[#2c3e50] text-semibold text-sm">Filter by Event:</label>
          <select 
            id="event-filter"
            value={selectedEvent} 
            onChange={(e) => handleEventFilter(e.target.value)}
            className="px-3 py-2 border-1 border-gray-300 rounded-lg text-[#2c3e50] text-sm min-w-[200px] focus:outline-none focus:ring-1 focus:ring-[#BC2649] hover:border-[#BC2649] transition-all duration-200"
          >
            <option value="all">All Events</option>
            {uniqueEvents.map((eventId) => (
              <option key={eventId} value={String(eventId)}>
                {eventsMap[eventId] || 'Unknown Event'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[#7f8c8d] text-sm">Showing:</span>
          <span className="bg-[#BC2649] text-white px-2 py-1 rounded-lg text-sm text-medium">{groupedUsers.length} purchasers ({filteredUsers.length} total tickets)</span>
          {selectedEvent !== "all" && (
            <button 
              onClick={() => handleEventFilter("all")} 
              className="bg-[#e74c3c] text-white border-none rounded-lg cursor-pointer text-sm px-2 py-1 hover:bg-[#c0392b] transition-all duration-200 transform hover:scale-103"
            >
              Clear Filter ✕
            </button>
          )}
        </div>
      </div>

      {groupedUsers.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 px-6 py-4 bg-[#f8f9fa] rounded-lg">
          <p className="text-sm">No users found for the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-1 border-[#e9ecef]">
          <table className="w-full border-collapse bg-white users-table">
            <thead >
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Event</th>
                <th>Tickets</th>
                <th>Email Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedUsers.map((groupedUser, index) => (
                <tr key={`${groupedUser.purchaserEmail}-${groupedUser.purchaseDate}`}>
                  <td className="text-center text-[#7f8c8d] w-[60px] text-medium">{index + 1}</td>
                  <td className="text-xs text-[#2c3e50] text-medium">{groupedUser.name}</td>
                  <td className="text-[#5a6c7d] text-xs user-email">{groupedUser.email}</td>
                  <td className="user-phone">{groupedUser.phone}</td>
                  <td className="text-left">{groupedUser.event?.name || 'Unknown Event'}</td>
                  <td>
                    <span className="inline-block bg-[#e7f3ff] text-[#0066cc] px-2 py-1 rounded-lg text-sm font-medium border-1 border-[#b3d9ff]">
                      {groupedUser.totalTickets} {groupedUser.totalTickets === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </td>
                  <td className="text-center">
                    {groupedUser.emailSent ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-block bg-[#d4edda] text-[#155724] px-2 py-1 rounded-lg text-xs font-medium border-1 border-[#c3e6cb]">
                          ✅ Sent
                        </span>
                        {groupedUser.emailSentAt && (
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(groupedUser.emailSentAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block bg-[#fff3cd] text-[#856404] px-2 py-1 rounded-lg text-xs font-medium border-1 border-[#ffeaa7]">
                        📧 Not Sent
                      </span>
                    )}
                  </td>
                  <td className="user-actions">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDownloadAllQRCodes(groupedUser)}
                        className="bg-[#007bff] text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#0069d9] transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                        title={groupedUser.totalTickets > 1 ? `Download ${groupedUser.totalTickets} QR codes` : 'Download QR code'}
                      >
                        {groupedUser.totalTickets > 1 ? 'Download All' : 'Download QR'}
                      </button>
                      <button
                        onClick={() => handleSendEmail(groupedUser)}
                        disabled={groupedUser.emailSent}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 shadow-md ${
                          groupedUser.emailSent 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60' 
                            : 'bg-[#28a745] text-white hover:bg-[#218838] cursor-pointer hover:shadow-lg'
                        }`}
                        title={
                          groupedUser.emailSent 
                            ? 'Email already sent' 
                            : `Send ${groupedUser.totalTickets > 1 ? `${groupedUser.totalTickets} QR codes` : 'QR code'} via email to ${groupedUser.email}`
                        }
                      >
                        {groupedUser.emailSent ? '📧 Email Sent' : '📧 Send Email'}
                      </button>
                    </div>
                    {/* Hidden QR canvases for download generation */}
                    <div style={{display: 'none'}}>
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex justify-center items-center z-1000 modal-overlay">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-[#333333]">Create New User</h2>
              <button 
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900 w-8 h-8 flex items-center justify-center"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6">
              <div className="mb-4">
                <label htmlFor="name" className="block text-1xl font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-1xl font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-1xl font-semibold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="eventId" className="block text-1xl font-semibold text-gray-700 mb-1">Event *</label>
                <select
                  id="eventId"
                  name="eventId"
                  value={newUser.eventId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="quantity" className="block text-1xl font-semibold text-gray-700 mb-1">Number of Tickets *</label>
                <select
                  id="quantity"
                  name="quantity"
                  value={newUser.quantity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                <small className="block mt-2 text-xs text-gray-500 italic">
                  All tickets will have the same contact information but unique QR codes
                </small>
              </div>

              <div className="mb-4">
                <label htmlFor="other" className="block text-1xl font-semibold text-gray-700 mb-1">Other Information</label>
                <input
                  type="text"
                  id="other"
                  name="other"
                  value={newUser.other}
                  onChange={handleInputChange}
                  placeholder="Additional information (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  maxLength={150}
                />
                <small className="block mt-1 text-xs text-gray-500">
                  Optional field for any additional information (max 150 characters)
                </small>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="bg-gray-500 text-white text-sm font-semibold rounded cursor-pointer hover:bg-gray-600 px-4 py-2"
                  onClick={handleCloseModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#bc2649] text-white text-sm font-semibold rounded cursor-pointer hover:bg-[#a51e3a] px-4 py-2"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNewPage;
