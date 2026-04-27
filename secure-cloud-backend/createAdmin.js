// createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const User = require('./models/User');
require('dotenv').config();

// Force public DNS resolvers so Atlas SRV lookups work even when local DNS blocks SRV records.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Example usage: node createAdmin.js recipient@example.com password123
const email = process.argv[2];
const password = process.argv[3];
const normalizedEmail = email?.trim().toLowerCase();

if (!email || !password) {
  console.error('❌ Error: Please provide an email and password.');
  console.log('Usage: node createAdmin.js <email> <password>');
  process.exit(1);
}

console.log('🚀 Connecting to MongoDB...');

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`ℹ️ User with email "${normalizedEmail}" already exists. Skipping creation.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ CORRECTED: Provide the role as a simple string in an array
    const userRoles = ['user'];

    await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      roles: userRoles,
    });

    console.log(`✅ User "${normalizedEmail}" created successfully!`);

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

createUser();