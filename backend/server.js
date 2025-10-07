import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';

import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import { connectDB } from './models/index.js';

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL;
app.use(cors({
    origin: clientUrl,
    credentials: true
}));

app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', authRoutes);

// Initialize database connection
connectDB();

// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
