import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'admins',
  timestamps: false
});

export default Admin;