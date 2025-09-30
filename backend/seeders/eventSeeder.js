import Event from '../models/Event.js';
import { connectDB } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const codeOne = process.env.EVENT_CODE_DAY1;
const codeTwo = process.env.EVENT_CODE_DAY2;

const seedEvents = async () => {
    try {
        // Connect to database
        await connectDB();

        // Create events
        const events = await Event.bulkCreate([
            {
                name: 'Tuk-Tuk Tour Day 1',
                code: codeOne
            },
            {
                name: 'Tuk-Tuk Tour Day 2',
                code: codeTwo
            }
        ]);

        console.log('✅ Events seeded successfully:');
        events.forEach(event => {
            console.log(`   - ${event.name}`);
        });

        return events;
    } catch (error) {
        console.error('❌ Error seeding events:', error);
    }
};

export default seedEvents;