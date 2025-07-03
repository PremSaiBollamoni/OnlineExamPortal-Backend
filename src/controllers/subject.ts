import { Response } from 'express';
import Subject from '../models/Subject';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

// Get all subjects
export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const subjects = await Subject.find().populate('facultyId', 'name facultyId');
    res.status(200).json(subjects);
  } catch (error: any) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single subject
export const getSubject = async (req: AuthRequest, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('facultyId', 'name facultyId');
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.status(200).json(subject);
  } catch (error: any) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create subject
export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, faculty, facultyId, school, department, specialization, semester } = req.body;

    // Validate facultyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ message: 'Invalid faculty ID format' });
    }

    const subject = await Subject.create({
      name,
      faculty,
      facultyId,
      school,
      department,
      specialization,
      semester: parseInt(semester)
    });

    const populatedSubject = await subject.populate('facultyId', 'name facultyId');
    res.status(201).json(populatedSubject);
  } catch (error: any) {
    console.error('Create subject error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update subject
export const updateSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, faculty, facultyId, school, department, specialization, semester } = req.body;
    
    // Validate facultyId is a valid ObjectId if provided
    if (facultyId && !mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ message: 'Invalid faculty ID format' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    subject.name = name || subject.name;
    subject.faculty = faculty || subject.faculty;
    subject.facultyId = facultyId || subject.facultyId;
    subject.school = school || subject.school;
    subject.department = department || subject.department;
    subject.specialization = specialization || subject.specialization;
    subject.semester = semester ? parseInt(semester) : subject.semester;

    const updatedSubject = await subject.save();
    const populatedSubject = await updatedSubject.populate('facultyId', 'name facultyId');
    res.status(200).json(populatedSubject);
  } catch (error: any) {
    console.error('Update subject error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req: AuthRequest, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.deleteOne();
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: error.message });
  }
}; 
