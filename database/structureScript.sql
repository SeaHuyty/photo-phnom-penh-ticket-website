CREATE DATABASE qrcode_db;
USE qrcode_db;

CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    used tinyint(1) NOT NULL DEFAULT 0,
    eventId INT NOT NULL,

    FOREIGN KEY (eventId) REFERENCES event (id);
);

CREATE TABLE event (
    id AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tickets INT NOT NULL,
);