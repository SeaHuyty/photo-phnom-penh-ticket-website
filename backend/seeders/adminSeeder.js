import Admin from '../models/Admin.js';
import { connectDB } from '../models/index.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmins = async () => {
    try {
        // Connect to database
        await connectDB();

        // Clear existing admins (optional)
        await Admin.destroy({ where: {} });

        // Hash the password before creating admin
        const saltRounds = 10;
        const password = process.env.ADMIN_PASSWORD;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin
        const admin = await Admin.create({
            username: 'admin',
            password: hashedPassword
        });

        console.log('✅ Admin seeded successfully:', admin.username);
    } catch (error) {
        console.error('❌ Error seeding admins:', error);
    }
};

export default seedAdmins;