-- PostgreSQL Database Schema for QR Code Ticket System
-- Create database: qrcode_db (run this manually in your PostgreSQL console)

CREATE TABLE IF NOT EXISTS event (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    eventId INTEGER NOT NULL,
    qrCode VARCHAR(100) NOT NULL,
    FOREIGN KEY (eventId) REFERENCES event (id)
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Sample data
INSERT INTO event (name) VALUES 
('Phnom Penh Festival 2025'),
('Cultural Night Experience');

INSERT INTO admins (username, password) VALUES 
('admin', 'admin123');