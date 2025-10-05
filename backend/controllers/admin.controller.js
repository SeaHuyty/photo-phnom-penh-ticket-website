// Admin Controller
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { sendTicketEmail } from '../utils/emailService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({
            where: { username }
        });

        if (!admin) {
            return res.status(401).json({ message: "Admin not found" });
        }

        // Compare password directly using bcrypt
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
        
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if admin still exists
        const admin = await Admin.findByPk(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: "Admin not found" });
        }
        
        res.status(200).json({ 
            message: "Authenticated", 
            admin: { 
                id: admin.id, 
                username: admin.username 
            } 
        });
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(401).json({ message: "Invalid token" });
    }
};

export const getAttendanceData = async (req, res) => {
    try {
        const { status, eventId } = req.query;
        
        let whereConditions = {};
        
        // Filter by scan status
        if (status === 'scanned') {
            whereConditions.used = true;
        } else if (status === 'unscanned') {
            whereConditions.used = false;
        }
        
        // Filter by event
        if (eventId && eventId !== 'all') {
            whereConditions.eventId = parseInt(eventId);
        }
        
        const users = await User.findAll({
            where: whereConditions,
            include: [{ 
                model: Event, 
                as: 'event',
                attributes: ['id', 'name']
            }],
            order: [['id', 'ASC']]
        });
        
        // Get attendance statistics
        const totalUsers = await User.count({
            where: eventId && eventId !== 'all' ? { eventId: parseInt(eventId) } : {}
        });
        
        const scannedCount = await User.count({
            where: {
                used: true,
                ...(eventId && eventId !== 'all' ? { eventId: parseInt(eventId) } : {})
            }
        });
        
        const unscannedCount = totalUsers - scannedCount;
        const attendanceRate = totalUsers > 0 ? ((scannedCount / totalUsers) * 100).toFixed(1) : 0;
        
        res.status(200).json({
            users,
            statistics: {
                total: totalUsers,
                scanned: scannedCount,
                unscanned: unscannedCount,
                attendanceRate: parseFloat(attendanceRate)
            }
        });
    } catch (err) {
        console.error('Error fetching attendance data:', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const sendTicketEmailToUser = async (req, res) => {
    try {
        const { purchaserEmail } = req.body;
        
        if (!purchaserEmail) {
            return res.status(400).json({ message: "Purchaser email is required" });
        }
        
        // Find all tickets for this purchaser email
        const users = await User.findAll({
            where: { purchaserEmail },
            include: [{ 
                model: Event, 
                as: 'event',
                attributes: ['id', 'name']
            }],
            order: [['ticketNumber', 'ASC']]
        });
        
        if (users.length === 0) {
            return res.status(404).json({ message: "No tickets found for this email" });
        }
        
        // Group tickets by event (in case user has tickets for multiple events)
        const ticketsByEvent = {};
        users.forEach(user => {
            const eventId = user.eventId;
            if (!ticketsByEvent[eventId]) {
                ticketsByEvent[eventId] = {
                    userInfo: {
                        name: user.name.replace(/ \(Ticket \d+\)$/, ''), // Remove ticket suffix
                        email: user.email,
                        phone: user.phone,
                        event: user.event
                    },
                    tickets: []
                };
            }
            
            ticketsByEvent[eventId].tickets.push({
                id: user.id,
                qrCode: user.qrCode,
                ticketNumber: user.ticketNumber || 1,
                used: user.used,
                scannedAt: user.scannedAt
            });
        });
        
        // Send emails for each event
        const emailResults = [];
        for (const eventId in ticketsByEvent) {
            const { userInfo, tickets } = ticketsByEvent[eventId];
            const result = await sendTicketEmail(userInfo, tickets);
            emailResults.push({
                event: userInfo.event.name,
                ticketCount: tickets.length,
                ...result
            });
        }
        
        // Check if any emails failed
        const failedEmails = emailResults.filter(result => !result.success);
        const successfulEmails = emailResults.filter(result => result.success);
        
        if (failedEmails.length > 0 && successfulEmails.length === 0) {
            return res.status(500).json({ 
                message: "Failed to send emails",
                errors: failedEmails.map(result => result.error)
            });
        } else if (failedEmails.length > 0) {
            return res.status(207).json({ // 207 Multi-Status
                message: "Some emails sent successfully, some failed",
                successful: successfulEmails,
                failed: failedEmails
            });
        }
        
        const totalTickets = emailResults.reduce((sum, result) => sum + result.ticketCount, 0);
        
        res.status(200).json({ 
            message: `Email sent successfully to ${purchaserEmail}`,
            totalTickets,
            emailResults: successfulEmails
        });
        
    } catch (err) {
        console.error('Error sending ticket email:', err);
        res.status(500).json({ 
            message: "Internal Server Error",
            error: err.message 
        });
    }
};
