import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import Student from '../src/models/Student.model.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server root
dotenv.config({ path: join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/verifai');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@verifai.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@verifai.com',
      passwordHash: 'admin123', // Will be hashed by pre-save hook
      role: 'ADMIN',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@verifai.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
