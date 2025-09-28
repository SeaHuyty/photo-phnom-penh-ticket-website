import React, { useState, useEffect } from "react";
import axios from "axios";
import Loader from "./Loader";

const BASE_URL = "http://localhost:3000/api";

const AttendanceCheck = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filter, setFilter] = useState("all"); // "all", "scanned", "unscanned"
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchAttendanceData().catch(err => {
            console.error("Error refetching attendance data:", err);
        });
    }, [filter, selectedEvent]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get events for the filter dropdown
            const eventsResponse = await axios.get(`${BASE_URL}/events`);
            setEvents(eventsResponse.data);
            
            // Get attendance data
            await fetchAttendanceData();
            
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to fetch attendance data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceData = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.append("status", filter);
            if (selectedEvent !== "all") params.append("eventId", selectedEvent);

            const response = await axios.get(`${BASE_URL}/admin/attendance?${params}`);

            setUsers(response.data.users);
            // If we have statistics from the server, we could use them instead of calculating locally
            // For now, we'll keep the local calculation for consistency
        } catch (err) {
            console.error("Error fetching attendance data:", err);
            throw err;
        }
    };

    const getAttendanceStats = () => {
        const total = users.length;
        const scanned = users.filter(user => user.used).length;
        const unscanned = total - scanned;
        const attendanceRate = total > 0 ? ((scanned / total) * 100).toFixed(1) : 0;

        return { total, scanned, unscanned, attendanceRate };
    };

    const handleRefresh = () => {
        fetchData();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="attendance-loading">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="attendance-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={handleRefresh} className="refresh-btn">
                    Try Again
                </button>
            </div>
        );
    }

    const stats = getAttendanceStats();

    return (
        <div className="attendance-check">
            <div className="attendance-header">
                <h1>Attendance Management</h1>
                <button onClick={handleRefresh} className="refresh-btn">
                    🔄 Refresh Data
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-container">
                <div className="stat-card total">
                    <h3>Total Tickets</h3>
                    <p className="stat-number">{stats.total}</p>
                </div>
                <div className="stat-card scanned">
                    <h3>Scanned</h3>
                    <p className="stat-number">{stats.scanned}</p>
                </div>
                <div className="stat-card unscanned">
                    <h3>Unscanned</h3>
                    <p className="stat-number">{stats.unscanned}</p>
                </div>
                <div className="stat-card rate">
                    <h3>Attendance Rate</h3>
                    <p className="stat-number">{stats.attendanceRate}%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <div className="filter-group">
                    <label htmlFor="status-filter">Filter by Status:</label>
                    <select 
                        id="status-filter"
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Tickets</option>
                        <option value="scanned">Scanned Only</option>
                        <option value="unscanned">Unscanned Only</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="event-filter">Filter by Event:</label>
                    <select 
                        id="event-filter"
                        value={selectedEvent} 
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Events</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Event</th>
                            <th>QR Code</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id} className={user.used ? 'scanned-row' : 'unscanned-row'}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.event ? user.event.name : 'N/A'}</td>
                                    <td className="qr-code">{user.qrCode}</td>
                                    <td>
                                        <span className={`status-badge ${user.used ? 'scanned' : 'unscanned'}`}>
                                            {user.used ? '✅ Scanned' : '⏳ Unscanned'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="no-data">
                                    No tickets found with the selected filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .attendance-check {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .attendance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .attendance-header h1 {
                    color: #333;
                    margin: 0;
                }

                .refresh-btn {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s;
                }

                .refresh-btn:hover {
                    background-color: #0056b3;
                }

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                    border-left: 4px solid;
                }

                .stat-card.total {
                    border-left-color: #6c757d;
                }

                .stat-card.scanned {
                    border-left-color: #28a745;
                }

                .stat-card.unscanned {
                    border-left-color: #ffc107;
                }

                .stat-card.rate {
                    border-left-color: #17a2b8;
                }

                .stat-card h3 {
                    margin: 0 0 10px 0;
                    color: #666;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .stat-number {
                    margin: 0;
                    font-size: 32px;
                    font-weight: bold;
                    color: #333;
                }

                .filters-container {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-group label {
                    font-weight: bold;
                    color: #333;
                    font-size: 14px;
                }

                .filter-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    background-color: white;
                    min-width: 150px;
                }

                .users-table-container {
                    overflow-x: auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .users-table th,
                .users-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }

                .users-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #333;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }

                .scanned-row {
                    background-color: #f8fff8;
                }

                .unscanned-row {
                    background-color: #fffcf0;
                }

                .qr-code {
                    font-family: monospace;
                    font-size: 12px;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .status-badge.scanned {
                    background-color: #d4edda;
                    color: #155724;
                }

                .status-badge.unscanned {
                    background-color: #fff3cd;
                    color: #856404;
                }

                .no-data {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px;
                }

                .attendance-loading,
                .attendance-error {
                    text-align: center;
                    padding: 40px;
                }

                .attendance-error {
                    color: #dc3545;
                }

                @media (max-width: 768px) {
                    .filters-container {
                        flex-direction: column;
                    }
                    
                    .attendance-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                    }
                    
                    .stats-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};

export default AttendanceCheck;