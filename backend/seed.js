const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const usersToEnsure = [
	{
		name: 'iHmaket Admin',
		email: 'admin@ihmaket.com',
		password: 'Admin123!',
		role: 'admin',
		phone: '08000000000',
		location: { city: 'Lagos', state: 'Lagos', country: 'Nigeria' }
	},
	{
		name: 'MKP Provider',
		email: 'provider@ihmaket.com',
		password: 'Password123!',
		role: 'provider',
		phone: '08011111111',
		location: { city: 'Abuja', state: 'FCT', country: 'Nigeria' }
	},
	{
		name: 'MKP Customer',
		email: 'customer@ihmaket.com',
		password: 'Password123!',
		role: 'customer',
		phone: '08022222222',
		location: { city: 'Ibadan', state: 'Oyo', country: 'Nigeria' }
	}
];

const ensureUsers = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		for (const userData of usersToEnsure) {
			const existing = await User.findOne({ email: userData.email });
			if (!existing) {
				const user = new User(userData);
				await user.save();
				console.log(`✅ Created user: ${userData.email}`);
			} else {
				console.log(`ℹ️ User already exists: ${userData.email}`);
			}
		}

		console.log('\n✅ Seed completed. Login credentials:');
		console.log('Admin: admin@ihmaket.com / Admin123!');
		console.log('Provider: provider@ihmaket.com / Password123!');
		console.log('Customer: customer@ihmaket.com / Password123!');

		await mongoose.connection.close();
		process.exit(0);
	} catch (error) {
		console.error('❌ Seed error:', error);
		process.exit(1);
	}
};

ensureUsers();
