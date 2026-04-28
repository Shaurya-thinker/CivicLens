const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const ADMIN = {
  email: (process.env.SEED_ADMIN_EMAIL || 'admin@civiclens.com').toLowerCase().trim(),
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
  name: process.env.SEED_ADMIN_NAME || 'demo admin',
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/civiclens';

async function seedAdmin() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  const hashedPassword = await bcrypt.hash(ADMIN.password, 12);
  const existingAdmin = await User.findOne({ email: ADMIN.email });

  if (existingAdmin) {
    existingAdmin.name = ADMIN.name;
    existingAdmin.role = 'admin';
    existingAdmin.password = hashedPassword;
    existingAdmin.isEmailVerified = true;
    existingAdmin.emailVerificationToken = null;
    existingAdmin.emailVerificationExpires = null;
    await existingAdmin.save();
    console.log(`✅ Admin account updated: ${ADMIN.email}`);
  } else {
    await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    console.log(`✅ Admin account created: ${ADMIN.email}`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error('❌ Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });