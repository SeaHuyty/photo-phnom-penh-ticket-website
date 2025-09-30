import seedAdmins from './adminSeeder.js';
import seedEvents from './eventSeeder.js';
import seedUsers from './userSeeder.js';
import { sequelize } from '../models/index.js';

const runAllSeeders = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        await sequelize.sync({ force: true });

        // Run seeders in order
        await seedAdmins();
        const events = await seedEvents();
        await seedUsers(events);

        console.log('🎉 All seeders completed successfully!');
        
        // Close database connection
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running seeders:', error);
        process.exit(1);
    }
};

runAllSeeders();

export default runAllSeeders;