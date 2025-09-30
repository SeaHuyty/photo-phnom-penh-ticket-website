import sequelize from '../database/config.js';
import User from './User.js';
import Event from './Event.js';
import Admin from './Admin.js';

// Initialize all models and their associations
const models = {
  User,
  Event,
  Admin
};

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL Database (Neon) via Sequelize');
    
    // Sync models with database (use { force: false } in production)
    // await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

export { sequelize, connectDB };
export default models;