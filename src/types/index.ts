import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
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

export interface IExamPaper extends Document {
  _id: string;
  title: string;
  description: string;
  subject: {
    _id: string;
    name: string;
    semester: number;
    facultyId: string;
  };
  facultyId: {
    _id: string;
    name: string;
  };
  department: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization: 'AIML' | 'DSML' | 'CSBS' | 'CN' | 'Forensic Science' | 'Anesthesia' | 'Radiology' | 'Optometry' | 'Pharmacy' | 'Agriculture' | 'No Specialization';
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  questions: IQuestion[];
  instructions: string;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  isSubmitted?: boolean;
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestion {
  _id: string;
  question: string;
  type: 'mcq' | 'subjective';
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

export interface ISubmission extends Document {
  _id: string;
  examPaper: string;
  student: string;
  answers: {
    questionIndex: number;
    selectedOption: number;
  }[];
  startTime: Date;
  endTime: Date;
  isSubmitted: boolean;
  score: number;
  evaluatedBy?: string;
  evaluatedAt?: Date;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResult extends Document {
  _id: string;
  examPaper: string;
  student: string;
  submission: string;
  score: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivity extends Document {
  _id: string;
  user: string;
  action: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubject extends Document {
  _id: string;
  name: string;
  faculty: string;
  facultyId: string;
  school: 'SOET' | 'SoPHAS' | 'SoM';
  department: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization: 'AIML' | 'DSML' | 'CSBS' | 'CN' | 'Forensic Science' | 'Anesthesia' | 'Radiology' | 'Optometry' | 'Pharmacy' | 'Agriculture' | 'No Specialization';
  semester: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  semester?: number;
  department?: 'CSE' | 'MECH' | 'ECE' | 'BSc' | 'BBA';
  specialization?: 'AIML' | 'DSML' | 'CSBS' | 'CN' | 'Forensic Science' | 'Anesthesia' | 'Radiology' | 'Optometry' | 'Pharmacy' | 'Agriculture' | 'No Specialization';
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiError extends Error {
  status?: number;
  response?: {
    data?: {
      message?: string;
    };
  };
} 