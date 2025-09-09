// Admin Controller
import pool from '../database/config.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const results = await pool.query("SELECT * FROM admins WHERE username = $1", [username]);

        if (results.rows.length === 0) {
            return res.status(401).json({ message: "Admin not found" });
        }

        const admin = results.rows[0];

        if (password !== admin.password) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
        
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
