import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import { IUser } from '../types';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cutmeamport');
    console.log('Connected to MongoDB');

    const adminData = {
      name: 'Admin User',
      email: 'admin@cutmap.ac.in',
      password: 'Admin@123',
      role: 'admin' as const,
      department: 'CSE'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);
    console.log('Admin user created successfully with email:', adminData.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin(); 