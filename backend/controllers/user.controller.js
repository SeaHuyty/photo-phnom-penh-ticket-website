// User Controller
import User from '../models/User.js';
import Event from '../models/Event.js';
import { sequelize } from '../models/index.js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// QR Code Security Functions
const QR_SECRET_KEY = process.env.QR_SECRET_KEY;

const hashQRData = (originalData) => {
  try {
    const hash = CryptoJS.HmacSHA256(originalData, QR_SECRET_KEY).toString();
    return hash;
  } catch (error) {
    console.error('Error hashing QR data:', error);
    return originalData;
  }
};

export const registerUser = async (req, res) => {
    const { name, email, phone, eventId, quantity = 1 } = req.body;

    if (!name || !email || !phone || !eventId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (quantity < 1 || quantity > 10) {
        return res.status(400).json({ message: "Quantity must be between 1 and 10" });
    }

    const transaction = await sequelize.transaction();
    
    try {
        // Check if event exists
        const event = await Event.findByPk(eventId, { transaction });

        if (!event) {
            await transaction.rollback();
            return res.status(400).json({ message: "Event not found" });
        }

        // Get all existing user IDs
        const existingUsers = await User.findAll({
            attributes: ['id'],
            transaction
        });

        const usedIds = existingUsers.map(user => user.id);

        let availableIds = Array.from({ length: 999999 }, (_, i) => i + 100000)
            .filter(id => !usedIds.includes(id));

        if (availableIds.length < quantity) {
            await transaction.rollback();
            return res.status(400).json({ message: "Not enough IDs available" });
        }

        const createdTickets = [];
        
        // Create multiple tickets
        for (let i = 0; i < quantity; i++) {
            const userId = availableIds[i];
            const qrCode = `${userId}-${event.code}`;
            const ticketName = quantity > 1 ? `${name} (Ticket ${i + 1})` : name;
            
            const ticket = await User.create({
                id: userId,
                name: ticketName,
                email,
                phone,
                used: false,
                eventId,
                qrCode,
                ticketNumber: i + 1,
                purchaserEmail: email,
                scannedAt: null
            }, { transaction });
            
            createdTickets.push({
                id: ticket.id,
                qrCode: ticket.qrCode,
                ticketNumber: ticket.ticketNumber
            });
        }

        await transaction.commit();
        res.status(201).json({ 
            message: `${quantity} ticket(s) created successfully`,
            tickets: createdTickets,
            totalTickets: quantity
        });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const verifyQrCode = async (req, res) => {
    let { qrCode, isHashed } = req.body;

    if (!qrCode) {
        return res.status(400).json({ message: "QR Code is required" });
    }

    qrCode = qrCode.toString().trim();

    try {
        let user = null;
        
        if (isHashed) {
            // If the QR code is hashed, we need to find the original by hashing all stored QR codes
            const allUsers = await User.findAll({
                include: [{ model: Event, as: 'event' }]
            });
            
            // Find user by comparing hashed values
            for (const potentialUser of allUsers) {
                const hashedOriginal = hashQRData(potentialUser.qrCode);
                if (hashedOriginal === qrCode) {
                    user = potentialUser;
                    break;
                }
            }
        } else {
            // Legacy support: direct QR code lookup (for backward compatibility)
            user = await User.findOne({ 
                where: { qrCode },
                include: [{ model: Event, as: 'event' }]
            });
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid QR Code" });
        }

        if (user.used) {
            return res.status(400).json({ message: "QR Code already used" });
        }

        await user.update({ 
            used: true,
            scannedAt: new Date()
        });

        res.status(200).json({ 
            message: "✅ QR Code verified successfully",
            user: {
                name: user.name,
                event: user.event.name
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getEvents = async (req, res) => {
    try {
        const events = await Event.findAll();

        if (events.length === 0) {
            return res.status(404).json({ message: "No events found" });
        }

        res.status(200).json(events);
    } catch (err) {
        console.log('Error fetching events:', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Event, as: 'event' }]
        });
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
