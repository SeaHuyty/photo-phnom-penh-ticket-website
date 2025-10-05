import User from '../models/User.js';
import { connectDB } from '../models/index.js';

const seedUsers = async (events) => {
    try {
        // Connect to database
        await connectDB();

        // Create new users with different purchase dates and email statuses for testing
        const purchase1Date = new Date('2025-10-03T09:30:00Z'); // John's first purchase
        const purchase2Date = new Date('2025-10-04T10:30:00Z'); // Jane's purchase
        const purchase3Date = new Date('2025-10-04T14:15:00Z'); // Bob's purchase
        const purchase4Date = new Date('2025-10-05T11:00:00Z'); // Alice's first purchase (2 tickets)
        const purchase5Date = new Date('2025-10-05T16:45:00Z'); // John's second purchase (new group)
        
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
                purchaserEmail: 'john.doe@example.com',
                emailSent: false,
                emailSentAt: null,
                other: 'VIP Guest - Front Row Seating',
                createdAt: purchase1Date
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
                purchaserEmail: 'jane.smith@example.com',
                emailSent: true,
                emailSentAt: new Date('2025-10-04T10:35:00Z'),
                other: 'Vegetarian meal requested',
                createdAt: purchase2Date
            },
            {
                id: 456789,
                name: 'Bob Wilson',
                email: 'bob.wilson@example.com',
                phone: '555-123-4567',
                used: false,
                eventId: events[0].id,
                qrCode: `456789-${events[0].code}`,
                ticketNumber: 1,
                purchaserEmail: 'bob.wilson@example.com',
                emailSent: false,
                emailSentAt: null,
                other: null,
                createdAt: purchase3Date
            },
            {
                id: 654321,
                name: 'Alice Johnson (Ticket 1)',
                email: 'alice.johnson@example.com',
                phone: '555-987-6543',
                used: false,
                eventId: events[1].id,
                qrCode: `654321-${events[1].code}`,
                ticketNumber: 1,
                purchaserEmail: 'alice.johnson@example.com',
                emailSent: false,
                emailSentAt: null,
                other: 'Group booking - Photography team',
                createdAt: purchase4Date
            },
            {
                id: 987654,
                name: 'Alice Johnson (Ticket 2)',
                email: 'alice.johnson@example.com',
                phone: '555-987-6543',
                used: false,
                eventId: events[1].id,
                qrCode: `987654-${events[1].code}`,
                ticketNumber: 2,
                purchaserEmail: 'alice.johnson@example.com',
                emailSent: false,
                emailSentAt: null,
                other: 'Group booking - Photography team',
                createdAt: purchase4Date
            },
            {
                id: 111222,
                name: 'John Doe (Second Purchase)',
                email: 'john.doe@example.com',
                phone: '123-456-7890',
                used: false,
                eventId: events[1].id,
                qrCode: `111222-${events[1].code}`,
                ticketNumber: 1,
                purchaserEmail: 'john.doe@example.com',
                emailSent: false,
                emailSentAt: null,
                other: 'Special dietary requirements',
                createdAt: purchase5Date
            }
        ]);

        console.log('✅ Users seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding users:', error);
    }
};

export default seedUsers;