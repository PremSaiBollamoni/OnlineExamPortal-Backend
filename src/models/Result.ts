import mongoose from 'mongoose';
import { IResult } from '../types';

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide student'],
  },
  examPaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamPaper',
    required: [true, 'Please provide exam paper'],
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: [true, 'Please provide submission'],
  },
  score: {
    type: Number,
    required: [true, 'Please provide score'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please provide total marks'],
  },
  percentage: {
    type: Number,
    required: [true, 'Please provide percentage'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IResult>('Result', resultSchema); 