import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';
import Event from './Event.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event,
      key: 'id'
    }
  },
  qrCode: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ticketNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  purchaserEmail: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  scannedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  other: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false
});

// Define associations
User.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Event.hasMany(User, { foreignKey: 'eventId', as: 'users' });

export default User;