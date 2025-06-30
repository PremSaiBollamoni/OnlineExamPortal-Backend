import mongoose from 'mongoose';
import { ISubject } from '../types';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide subject name'],
    minlength: 3,
    maxlength: 100,
  },
  faculty: {
    type: String,
    required: [true, 'Please provide faculty name'],
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide faculty ID'],
  },
  school: {
    type: String,
    enum: ['SOET', 'SoPHAS', 'SoM'],
    required: [true, 'Please provide school'],
  },
  department: {
    type: String,
    enum: ['CSE', 'MECH', 'ECE', 'BSc', 'BBA'],
    required: [true, 'Please provide department'],
  },
  specialization: {
    type: String,
    enum: [
      'AIML', 'DSML', 'CSBS', 'CN',
      'Forensic Science', 'Anesthesia', 'Radiology',
      'Optometry', 'Pharmacy', 'Agriculture',
      'No Specialization'
    ],
    required: [true, 'Please provide specialization'],
  },
  semester: {
    type: Number,
    required: [true, 'Please provide semester'],
    validate: {
      validator: function(this: any, v: number) {
        if (this.school === 'SOET') {
          return v >= 1 && v <= 8;
        } else {
          return v >= 1 && v <= 6;
        }
      },
      message: 'Invalid semester for the selected school'
    }
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

// Update the updatedAt timestamp before saving
subjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure faculty exists before saving
subjectSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User');
    const faculty = await User.findById(this.facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      throw new Error('Invalid faculty ID');
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<ISubject>('Subject', subjectSchema); 