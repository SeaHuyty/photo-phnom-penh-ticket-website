import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAdminAuth = (req, res, next) => {
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

export const scanPage = (req, res) => {
    res.status(200).json({ message: "You have access to the Scan page" });
};

export const sendEmailPage = (req, res) => {
    res.status(200).json({ message: "You have access to the Send Email page" });
};

export const checkAuth = (req, res) => {
    res.status(200).json({ message: "Admin is authenticated" });
};
