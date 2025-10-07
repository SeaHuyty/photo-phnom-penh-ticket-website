import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const useSsl = String(process.env.DATABASE_SSL || 'false').toLowerCase() === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  logging: false,
});

export default sequelize;
