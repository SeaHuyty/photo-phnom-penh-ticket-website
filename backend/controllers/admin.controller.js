// Admin Controller
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

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
