// User Controller
import pool from '../database/config.js';

export const registerUser = async (req, res) => {
    const { name, email, phone, eventId } = req.body;

    if (!name || !email || !phone || !eventId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const eventResult = await pool.query("SELECT tickets FROM event WHERE id = $1", [eventId]);

        if (eventResult.rows.length === 0) {
            return res.status(400).json({ message: "Event not found" });
        }

        const ticketsAvailable = eventResult.rows[0].tickets;

        if (ticketsAvailable <= 0) {
            return res.status(400).json({ message: "No tickets available for this event" });
        }

        const usersResult = await pool.query("SELECT id FROM users");

        const usedIds = usersResult.rows.map(row => row.id);

        let availableIds = Array.from({ length: 999999 }, (_, i) => i + 100000)
            .filter(id => !usedIds.includes(id));

        if (availableIds.length === 0) {
            return res.status(400).json({ message: "No more IDs available" });
        }

        const userId = availableIds[Math.floor(Math.random() * availableIds.length)];

        const qrCode = `${userId}-${eventId}`;

        await pool.query("UPDATE event SET tickets = tickets - 1 WHERE id = $1", [eventId]);

        await pool.query(
            "INSERT INTO users (id, name, email, phone, used, eventId, qrCode) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [userId, name, email, phone, 0, eventId, qrCode]
        );

        res.status(201).json({ qrCode });
    } catch (err) {
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
        const result = await pool.query("SELECT * FROM users WHERE qrCode = $1", [qrCode]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid QR Code" });
        }

        if (result.rows[0].used) {
            return res.status(400).json({ message: "QR Code already used" });
        }

        await pool.query("UPDATE users SET used = 1 WHERE qrCode = $1", [qrCode]);

        res.status(200).json({ message: "✅ QR Code verified successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getEvents = async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM event WHERE tickets > 0");

        if (results.rows.length === 0) {
            return res.status(404).json({ message: "No events with available tickets found" });
        }

        res.status(200).json(results.rows);
    } catch (err) {
        console.log('Error fetching events:', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUsers = async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM users");
        res.status(200).json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
