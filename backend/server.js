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

// ✅ Register User & Generate Unique ID
app.post("/api/register", (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check for duplicate email
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length > 0) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // Fetch all used IDs
        db.query("SELECT id FROM users", (err, results) => {
            if (err) return res.status(500).send("Database error");

            const usedIds = results.map(row => row.id);
            let availableIds = Array.from({ length: 500 }, (_, i) => i + 1).filter(id => !usedIds.includes(id));

            if (availableIds.length === 0) {
                return res.status(400).json({ message: "No more IDs available" });
            }

            // Select a random available ID
            const userId = availableIds[Math.floor(Math.random() * availableIds.length)];

            // Save user in DB
            db.query(
                "INSERT INTO users (id, name, email, phone, used) VALUES (?, ?, ?, ?, ?)", 
                [userId, name, email, phone, 0], 
                (err) => {
                    if (err) return res.status(500).json({ message: "Error saving user" });
                    res.json({ userId });
                }
            );
        });
    });
});

// ✅ Verify QR Code
app.post("/api/verify", (req, res) => {
    let { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    userId = userId.toString().trim(); // ✅ Remove spaces
    userId = parseInt(userId, 10); // ✅ Convert to number

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

// ✅ Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});