const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// CORS setup with credentials support
app.use(cors({
    origin: "http://localhost:5173", // Allow frontend domain
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MySQL Database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123abc",

    database: "qrcode_db",
});

db.connect(err => {
    if (err) console.error("Database connection error:", err);
    else console.log("✅ Connected to MySQL Database");
});

// Secret Key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "yourSuperSecretKey";

//  Register User & Generate Unique ID
app.post("/api/register", (req, res) => {
    const { name, email, phone, eventId } = req.body;

    if (!name || !email || !phone || !eventId) {
        return res.status(400).json({ message: "All fields are required" });
    }

    db.query("SELECT tickets FROM event WHERE id = ?", [eventId], (err, eventResults) => {
        if (err) return res.status(500).json({ message: "Database error" });
    
        if (eventResults.length === 0) {
            return res.status(400).json({ message: "Event not found" });
        }
    
        const ticketsAvailable = eventResults[0].tickets;
        if (ticketsAvailable <= 0) {
            return res.status(400).json({ message: "No tickets available for this event" });
        }
    
        db.query("SELECT id FROM users", (err, results) => {
            if (err) return res.status(500).send("Database error");
    
            const usedIds = results.map(row => row.id);
            let availableIds = Array.from({ length: 999999 }, (_, i) => i + 100000)
                                    .filter(id => !usedIds.includes(id));
    
            if (availableIds.length === 0) {
                return res.status(400).json({ message: "No more IDs available" });
            }
    
            const userId = availableIds[Math.floor(Math.random() * availableIds.length)];
            const qrCode = `${userId}-${eventId}`;
    
            db.query("UPDATE event SET tickets = tickets - 1 WHERE id = ?", [eventId], (err) => {
                if (err) return res.status(500).json({ message: "Error updating ticket count" });
    
                db.query(
                    "INSERT INTO users (id, name, email, phone, used, eventId, qrCode) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                    [userId, name, email, phone, 0, eventId, qrCode], 
                    (err) => {
                        if (err) return res.status(500).json({ message: "Error saving user" });
                        res.json({ qrCode });
                    }
                );
            });
        });
    });
});

// Verify QR Code
app.post("/api/verify", (req, res) => {
    let { qrCode } = req.body;

    if (!qrCode) {
        return res.status(400).json({ message: "QR Code is required" });
    }

    qrCode = qrCode.toString().trim();

    db.query("SELECT * FROM users WHERE qrCode = ?", [qrCode], (err, result) => {
        if (err) return res.status(500).send("Database error");

        if (result.length === 0) {
            return res.status(400).json({ message: "Invalid QR Code" });
        }

        if (result[0].used) {
            return res.status(400).json({ message: "QR Code already used" });
        }

        db.query("UPDATE users SET used = 1 WHERE qrCode = ?", [qrCode], (err) => {
            if (err) return res.status(500).send("Error updating record");
            res.json({ message: "✅ QR Code verified successfully" });
        });
    });
});

// Get Events
app.get("/api/events", (req, res) => {
    db.query("SELECT * FROM event WHERE tickets > 0", (err, results) => {
        if (err) return res.status(500).send("Database error");
        res.json(results);
    });
});

// Get All Users
app.get("/api/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// Admin Login (Using JWT)
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM admins WHERE username = ?", [username], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Admin not found" });
        }

        const admin = results[0];

        // Compare plain text password
        if (password !== admin.password) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    });
});

// Middleware to Verify JWT
const requireAdminAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.admin = decoded;
        next();
    });
};

// Protected Admin Routes
app.get("/api/scan", requireAdminAuth, (req, res) => {
    res.json({ message: "You have access to the Scan page" });
});

app.get("/api/send-email", requireAdminAuth, (req, res) => {
    res.json({ message: "You have access to the Send Email page" });
});

// Admin Authentication Check
app.get("/api/admin/check-auth", requireAdminAuth, (req, res) => {
    res.json({ message: "Admin is authenticated" });
});

// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});