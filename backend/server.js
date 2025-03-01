const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MySQL Database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rootAdmin123",
    database: "qrcode_db"
});

db.connect(err => {
    if (err) console.error("Database connection error:", err);
    else console.log("✅ Connected to MySQL Database");
});

// ✅ Register User & Generate Unique ID (1-500)
app.post("/api/register", (req, res) => {
    const { name, email, phone, eventId } = req.body;

    if (!name || !email || !phone || !eventId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check for duplicate email
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error("Database error when checking email:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // Check if tickets are available for the selected event
        db.query("SELECT tickets FROM event WHERE id = ?", [eventId], (err, eventResults) => {
            if (err) {
                console.error("Database error when checking event tickets:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (eventResults.length === 0) {
                return res.status(400).json({ message: "Event not found" });
            }

            const ticketsAvailable = eventResults[0].tickets;
            if (ticketsAvailable <= 0) {
                return res.status(400).json({ message: "No tickets available for this event" });
            }

            // Fetch all used IDs
            db.query("SELECT id FROM users", (err, results) => {
                if (err) {
                    console.error("Database error when fetching used IDs:", err);
                    return res.status(500).send("Database error");
                }

                const usedIds = results.map(row => row.id);
                let availableIds = Array.from({ length: 500 }, (_, i) => i + 1).filter(id => !usedIds.includes(id));

                if (availableIds.length === 0) {
                    return res.status(400).json({ message: "No more IDs available" });
                }

                // Select a random available ID
                const userId = availableIds[Math.floor(Math.random() * availableIds.length)];

                // Reduce ticket count by 1 for the selected event
                db.query("UPDATE event SET tickets = tickets - 1 WHERE id = ?", [eventId], (err) => {
                    if (err) {
                        console.error("Database error when updating ticket count:", err);
                        return res.status(500).json({ message: "Error updating ticket count" });
                    }

                    // Save user in DB
                    db.query(
                        "INSERT INTO users (id, name, email, phone, used, eventId) VALUES (?, ?, ?, ?, ?, ?)", 
                        [userId, name, email, phone, 0, eventId], 
                        (err) => {
                            if (err) {
                                console.error("Error saving user to database:", err);
                                return res.status(500).json({ message: "Error saving user" });
                            }
                            res.json({ userId });
                        }
                    );
                });
            });
        });
    });
});

// ✅ Verify QR Code (with event handling)
app.post("/api/verify", (req, res) => {
    let { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    userId = userId.toString().trim();
    userId = parseInt(userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid QR Code format" });
    }

    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).send("Database error");

        if (result.length === 0) {
            return res.status(400).json({ message: "Invalid QR Code" });
        }

        if (result[0].used) {
            return res.status(400).json({ message: "QR Code already used" });
        }

        // Mark QR code as used
        db.query("UPDATE users SET used = 1 WHERE id = ?", [userId], (err) => {
            if (err) return res.status(500).send("Error updating record");
            res.json({ message: "✅ QR Code verified successfully" });
        });
    });
});

// ✅ Get Events (To check available events and tickets)
app.get("/api/events", (req, res) => {
    db.query("SELECT * FROM event WHERE tickets > 0", (err, results) => {
        if (err) return res.status(500).send("Database error");
        res.json(results);
    });
});

// ✅ Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});