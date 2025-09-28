import Event from '../models/Event.js';
import { connectDB } from '../models/index.js';

const seedEvents = async () => {
    try {
        // Connect to database
        await connectDB();

        // Clear existing events (optional)
        await Event.destroy({ where: {} });

        // Create events
        const events = await Event.bulkCreate([
            {
                name: 'Phnom Penh Festival 2025'
            },
            {
                name: 'Cultural Night Experience'
            }
        ]);

        console.log('✅ Events seeded successfully:');
        events.forEach(event => {
            console.log(`   - ${event.name}`);
        });
    } catch (error) {
        console.error('❌ Error seeding events:', error);
    }
};

export default seedEvents;