import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AttendanceCheck = () => {
    const [users, setUsers] = useState([]);
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center px-6 py-4 h-[100vh] text-[#7f8c8d]">
                <div className="loading-spinner"></div>
                <p>Loading attendance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10">
                <h2 className="text-[#BC2649] text-center text-xl font-bold">Error</h2>
                <p className="text-center text-[#7f8c8d]">{error}</p>
                <button onClick={handleRefresh} className="bg-[#007bff] text-white px-4 py-2 rounded mt-4 hover:bg-[#0056b3] transition duration-300 cursor-pointer">
                    Try Again
                </button>
            </div>
        );
    }

    const stats = getAttendanceStats();

    return (
        <div className="p-5 max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-7">
                <h1 className="text-2xl font-bold">Attendance Management</h1>
                <button onClick={handleRefresh} className="bg-[#007bff] text-white px-4 py-2 rounded hover:bg-[#0056b3] transition duration-300 cursor-pointer">
                    🔄 Refresh Data
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-5 mb-6">
                <div className="bg-white shadow-md p-5 rounded-lg text-center border-l-5 border-[#6c757d]">
                    <h3 className="font-semibold text-[#666] text-lg">Total Tickets</h3>
                    <p className="text-[#333] text-3xl font-semibold mt-2">{stats.total}</p>
                </div>
                <div className="bg-white shadow-md p-5 rounded-lg text-center border-l-5 border-[#28a745]">
                    <h3 className="font-semibold text-[#666] text-lg">Scanned</h3>
                    <p className="text-[#333] text-3xl font-semibold mt-2">{stats.scanned}</p>
                </div>
                <div className="bg-white shadow-md p-5 rounded-lg text-center border-l-5 border-[#dc3545]">
                    <h3 className="font-semibold text-[#666] text-lg">Unscanned</h3>
                    <p className="text-[#333] text-3xl font-semibold mt-2">{stats.unscanned}</p>
                </div>
                <div className="bg-white shadow-md p-5 rounded-lg text-center border-l-5 border-[#ffc107]">
                    <h3 className="font-semibold text-[#666] text-lg">Attendance Rate</h3>
                    <p className="text-[#333] text-3xl font-semibold mt-2">{stats.attendanceRate}%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-5 mb-6 p-4 bg-[#f8f9fa] rounded-lg">
                <div className="flex flex-col gap-2">
                    <label htmlFor="status-filter" className="font-semibold text-[#333]">Filter by Status:</label>
                    <select 
                        id="status-filter"
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-[#ddd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#007bff] min-w-[150px]"
                    >
                        <option value="all">All Tickets</option>
                        <option value="scanned">Scanned Only</option>
                        <option value="unscanned">Unscanned Only</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="event-filter" className="font-semibold text-[#333]">Filter by Event:</label>
                    <select 
                        id="event-filter"
                        value={selectedEvent} 
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="px-3 py-2 border border-[#ddd] rounded-md focus:outline-none focus:ring-1 focus:ring-[#007bff] min-w-[150px]"
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
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="w-[100%] border-collapse users-table">
                    <thead className="bg-[#f8f9fa]">
                        <tr>
                            <th className="w-[60px]">ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Event</th>
                            <th className="w-[150px]">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.event ? user.event.name : 'N/A'}</td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-2xl font-semibold ${user.used ? 'bg-[#d4edda] text-[#155724]' : 'bg-[#fff3cd] text-[#856404]'}`}>
                                            {user.used ? 'Scanned' : 'Unscanned'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center text-[#666] p-10 text-italic">
                                    No tickets found with the selected filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
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
            `}</style>
        </div>
    );
};

export default AttendanceCheck;