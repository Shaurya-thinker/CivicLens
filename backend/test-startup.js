const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 Backend Startup Test');
console.log('========================');

// Test 1: Check required dependencies
console.log('1. Checking dependencies...');
try {
  require('bcryptjs');
  require('jsonwebtoken');
  require('cors');
  require('helmet');
  require('express-rate-limit');
  console.log('   ✅ All dependencies found');
} catch (error) {
  console.log('   ❌ Missing dependency:', error.message);
  process.exit(1);
}

// Test 2: Check environment variables
console.log('2. Checking environment variables...');
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('   ❌ Missing environment variables:', missingVars.join(', '));
  console.log('   💡 Create a .env file with: JWT_SECRET=your-secret-key');
} else {
  console.log('   ✅ Required environment variables found');
}

// Test 3: Check file imports
console.log('3. Checking file imports...');
try {
  require('./models/User');
  require('./models/Complaint');
  require('./controllers/auth.controller');
  require('./controllers/complaint.controller');
  require('./middleware/auth.middleware');
  require('./routes/auth.routes');
  require('./routes/complaint.routes');
  console.log('   ✅ All files import successfully');
} catch (error) {
  console.log('   ❌ Import error:', error.message);
  process.exit(1);
}

// Test 4: Test MongoDB connection (optional)
console.log('4. Testing MongoDB connection...');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/civiclens';

mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('   ✅ MongoDB connection successful');
  mongoose.connection.close();
  console.log('\n🎉 Backend startup test completed successfully!');
  console.log('💡 Run "npm start" to start the server');
})
.catch((error) => {
  console.log('   ⚠️  MongoDB connection failed:', error.message);
  console.log('   💡 Make sure MongoDB is running or check MONGO_URI');
  console.log('\n✅ Backend files are ready (MongoDB connection optional for testing)');
});