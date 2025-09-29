// User Controller
import User from '../models/User.js';
import Event from '../models/Event.js';
import { sequelize } from '../models/index.js';

export const registerUser = async (req, res) => {
    const { name, email, phone, eventId } = req.body;

    if (!name || !email || !phone || !eventId) {
        return res.status(400).json({ message: "All fields are required" });
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

        if (availableIds.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "No more IDs available" });
        }

        const userId = availableIds[Math.floor(Math.random() * availableIds.length)];
        const qrCode = `${userId}-${event.code}`;

        // Create new user
        await User.create({
            id: userId,
            name,
            email,
            phone,
            used: false,
            eventId,
            qrCode
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ qrCode });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const verifyQrCode = async (req, res) => {
    let { qrCode } = req.body;

    if (!qrCode) {
        return res.status(400).json({ message: "QR Code is required" });
    }

    qrCode = qrCode.toString().trim();

    try {
        const user = await User.findOne({ 
            where: { qrCode },
            include: [{ model: Event, as: 'event' }]
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid QR Code" });
        }

        if (user.used) {
            return res.status(400).json({ message: "QR Code already used" });
        }

        await user.update({ used: true });

        res.status(200).json({ message: "✅ QR Code verified successfully" });
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
