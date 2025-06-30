import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

interface IUserDocument extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'admin';
  studentId?: string;
  facultyId?: string;
  school?: 'SOET' | 'SoPHAS' | 'SoM';
  department?: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization?: 'AIML' | 'DSML' | 'CSBS' | 'CN' | 'Forensic Science' | 'Anesthesia' | 'Radiology' | 'Optometry' | 'Pharmacy' | 'Agriculture' | 'No Specialization';
  semester?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student',
  },
  studentId: {
    type: String,
    sparse: true,
    validate: {
      validator: function(this: IUserDocument, v: string | null) {
        // Allow any numerical format
        return !v || /^[0-9]+$/.test(v);
      },
      message: 'Student ID must be numerical'
    },
    required: [
      function(this: IUserDocument) { 
        return this.role === 'student';
      },
      'Student ID is required for students'
    ],
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { studentId: { $exists: true, $ne: '' } }
    }
  },
  facultyId: {
    type: String,
    sparse: true,
    validate: {
      validator: function(this: IUserDocument, v: string | null) {
        // Skip validation if the field is empty and role is not faculty
        if (!v && this.role !== 'faculty') return true;
        // Only validate if it's a faculty
        if (this.role === 'faculty') {
          return v && /^FAC[0-9]{4}$/.test(v); // Format: FACxxxx (e.g., FAC0123)
        }
        return true;
      },
      message: 'Faculty ID must be in format: FACxxxx (e.g., FAC0123)'
    },
    required: [
      function(this: IUserDocument) { 
        return this.role === 'faculty';
      },
      'Faculty ID is required for faculty members'
    ],
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { facultyId: { $exists: true, $ne: '' } }
    }
  },
  school: {
    type: String,
    enum: ['SOET', 'SoPHAS', 'SoM'],
    required: false,
  },
  department: {
    type: String,
    enum: ['CSE', 'MECH', 'ECE', 'BSc', 'BBA'],
    required: false,
  },
  semester: {
    type: Number,
    validate: {
      validator: function(this: any, v: number | undefined) {
        if (this.role !== 'student') return true;
        if (v === undefined) return true; // Make semester optional
        
        switch(this.school) {
          case 'SOET':
            return v >= 1 && v <= 8;
          case 'SoPHAS':
          case 'SoM':
            return v >= 1 && v <= 6;
          default:
            return false;
        }
      },
      message: 'Invalid semester for the selected school'
    },
    required: false // Make semester optional
  },
  specialization: {
    type: String,
    enum: [
      'AIML', 'DSML', 'CSBS', 'CN',
      'Forensic Science', 'Anesthesia', 'Radiology',
      'Optometry', 'Pharmacy', 'Agriculture',
      'No Specialization'
    ],
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUserDocument>('User', userSchema); 