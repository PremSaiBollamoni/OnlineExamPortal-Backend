import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const resetDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cutmeamport');
    console.log('Connected to MongoDB');

    // Delete all users
    await User.deleteMany({});
    console.log('Deleted all users');

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@cutmap.ac.in',
      password: 'Admin@123', // Password will be hashed by the User model
      role: 'admin' as const,
      department: 'CSE'
    };

    await User.create(adminData);
    
    // Verify admin user was created
    const adminUser = await User.findOne({ email: adminData.email });
    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // Test password comparison
    const isPasswordValid = await adminUser.comparePassword('Admin@123');
    if (!isPasswordValid) {
      throw new Error('Password comparison failed');
    }

    console.log('Admin user created and verified:', {
      email: adminData.email,
      role: adminUser.role,
      passwordValid: isPasswordValid
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetDb(); 