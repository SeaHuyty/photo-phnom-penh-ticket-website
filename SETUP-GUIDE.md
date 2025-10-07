# Photo Phnom Penh Festival Ticket System - Setup Guide

This guide will help you set up and run the Photo Phnom Penh Festival Ticket System on your computer using Docker, without needing to install Node.js, VSCode, or any other development tools.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your computer
- Git (optional, only if you want to clone the repository)

## Setup Steps

### 1. Get the Project Files

Either:

- Clone the repository: `git clone https://github.com/SeaHuyty/fullstack-photo-phnom-penh-festival-ticket-system.git`
- Or download and extract the ZIP file from GitHub

### 2. Create Environment File

1. Navigate to the project folder
2. Copy the example environment file:
   ```
   copy .env.example .env
   ```
3. Edit the `.env` file with your actual credentials:
   - Database connection details (if using your own Neon PostgreSQL instance)
   - JWT secret keys
   - Email settings
   - Admin password

### 3. Run with Docker

Open a terminal/command prompt in the project folder and run:

```
docker compose up --build
```

This will:

- Build the Docker images for the frontend and backend
- Start the containers
- Connect the backend to the database
- Serve the frontend

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### 5. Seed the Database (Optional)

If you need to add test data to the database:

```
docker compose exec backend npm run seed
```

## Common Issues & Solutions

- **Frontend can't connect to backend**: Make sure both containers are running and check the `VITE_API_BASE_URL` in your `.env` file
- **Backend can't connect to database**: Verify your `DATABASE_URL` and `DATABASE_SSL` settings in the `.env` file
- **Port conflicts**: If ports 3000 or 5173 are already in use, modify the port mapping in `docker-compose.yml`

## Stopping the Application

To stop the application:

```
# If running in the foreground (with logs showing)
Press Ctrl+C

# If running in detached mode
docker compose down
```

## Updating Environment Variables

If you change environment variables:

- Backend-only changes: `docker compose restart backend`
- Frontend changes: `docker compose up --build -d`
