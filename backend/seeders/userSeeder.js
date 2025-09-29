import User from '../models/User.js';
import { connectDB } from '../models/index.js';

const seedUsers = async (events) => {
    try {
        // Connect to database
        await connectDB();

        // Create new user
        await User.bulkCreate([
            {
                id: 123456,
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890',
                used: false,
                eventId: events[0].id,
                qrCode: `123456-${events[0].code}`,
                ticketNumber: 1,
                purchaserEmail: 'john.doe@example.com'
            },
            {
                id: 789012,
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '987-654-3210',
                used: false,
                eventId: events[1].id,
                qrCode: `789012-${events[1].code}`,
                ticketNumber: 1,
                purchaserEmail: 'jane.smith@example.com'
            }
        ]);

        console.log('✅ Users seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding users:', error);
    }
};

export default seedUsers;