import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'event',
  timestamps: false
});

export default Event;