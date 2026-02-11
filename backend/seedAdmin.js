const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user
    const adminEmail = 'admin@ihmaket.com';
    const adminPassword = 'admin123';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin already exists. Updating role and password...');
      admin.role = 'admin';
      admin.password = adminPassword;
      await admin.save();
    } else {
      admin = await User.create({
        name: 'iHmaket Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
        isVerified: true
      });
      console.log('✅ Admin user created');
    }

    console.log('\n🎉 Admin Account Ready!');
    console.log('Email: admin@ihmaket.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
