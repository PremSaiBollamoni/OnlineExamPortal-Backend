import mongoose from 'mongoose';
import { IExamPaper } from '../types';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide question'],
  },
  type: {
    type: String,
    enum: ['mcq', 'subjective'],
    required: [true, 'Please specify question type'],
  },
  options: {
    type: [String],
    required: function(this: any) {
      return this.type === 'mcq';
    },
    validate: {
      validator: function(this: any, val: string[]) {
        if (this.type === 'mcq') {
          return val.length === 4;
        }
        return true;
      },
      message: 'MCQ questions must have exactly 4 options'
    },
  },
  correctAnswer: {
    type: String,
    required: function(this: any) {
      return this.type === 'mcq';
    },
  },
  marks: {
    type: Number,
    required: [true, 'Please provide marks'],
    min: 1,
  },
});

const examPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide title'],
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Please provide subject'],
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide faculty'],
  },
  department: {
    type: String,
    enum: ['CSE', 'MECH', 'ECE', 'BSc', 'BBA'],
    uppercase: true,
  },
  specialization: {
    type: String,
    enum: ['AIML', 'DSML', 'CSBS', 'CN', 'Forensic Science', 'Anesthesia', 'Radiology', 'Optometry', 'Pharmacy', 'Agriculture', 'No Specialization'],
    uppercase: true,
  },
  duration: {
    type: Number,
    required: [true, 'Please provide duration in minutes'],
    min: 1,
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please provide total marks'],
    min: 1,
  },
  passingMarks: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  questions: {
    type: [questionSchema],
    required: [true, 'Please provide questions'],
    validate: [(val: any[]) => val.length > 0, 'Must provide at least one question'],
  },
  instructions: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Virtual field to get semester from subject
examPaperSchema.virtual('semester').get(function() {
  return this.subject?.semester;
});

// Pre-save middleware to set department and specialization from subject
examPaperSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('subject')) {
    try {
      const subject = await this.model('Subject').findById(this.subject);
      if (subject) {
        this.department = subject.department;
        this.specialization = subject.specialization;
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Always populate subject and faculty
examPaperSchema.pre('find', function() {
  this.populate('subject').populate('facultyId');
});

examPaperSchema.pre('findOne', function() {
  this.populate('subject').populate('facultyId');
});

export default mongoose.model<IExamPaper>('ExamPaper', examPaperSchema); 