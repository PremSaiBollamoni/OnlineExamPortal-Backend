import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Submission, { ISubmission } from '../models/Submission';
import ExamPaper from '../models/ExamPaper';
import Result from '../models/Result';
import Subject from '../models/Subject';
import { AuthRequest } from '../types';
import Activity from '../models/Activity';
import { Types } from 'mongoose';

// Get submissions
export const getSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user?.role === 'student') {
      query = { student: req.user._id };
    } else if (req.user?.role === 'faculty') {
      // Get exam papers created by this faculty
      const examPapers = await ExamPaper.find({ facultyId: req.user._id });
      const examPaperIds = examPapers.map(paper => paper._id);
      query = { examPaper: { $in: examPaperIds } };
    }

    const submissions = await Submission.find(query)
      .populate({
        path: 'examPaper',
        select: 'title totalMarks passingMarks',
        populate: {
          path: 'subject',
          select: 'name semester department specialization'
        }
      })
      .populate('student', 'name studentId')
      .populate('evaluatedBy', 'name');

    res.json(submissions);
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

interface PopulatedSubmission {
  examPaper: {
    subject: {
      facultyId: string;
    };
  };
  student: {
    _id: string;
  };
}

// Get single submission
export const getSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name studentId')
      .populate('examPaper', 'title questions subject totalMarks')
      .populate('evaluatedBy', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching submission',
      error: error.message 
    });
  }
};

// Submit exam (student submits exam)
export const submitExam = async (req: AuthRequest, res: Response) => {
  try {
    const { examPaper, answers, startTime, endTime } = req.body;

    // Validate required fields
    if (!examPaper) {
      return res.status(400).json({ 
        message: 'examPaper is required'
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        message: 'answers must be an array'
      });
    }

    // Validate answer format
    const isValidAnswers = answers.every(answer => 
      typeof answer.questionIndex === 'number' && 
      typeof answer.selectedOption === 'string'
    );

    if (!isValidAnswers) {
      return res.status(400).json({ 
        message: 'Each answer must have questionIndex (number) and selectedOption (string)'
      });
    }

    // Check if exam paper exists
    const examPaperDoc = await ExamPaper.findById(examPaper);
    if (!examPaperDoc) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    // Check if student already submitted this exam
    const existingSubmission = await Submission.findOne({
      student: req.user?._id,
      examPaper: examPaper,
      isSubmitted: true
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: 'You have already submitted this exam'
      });
    }

    // Create submission
    const submission = await Submission.create({
      student: req.user?._id,
      examPaper,
      answers,
      startTime: startTime || new Date(),
      endTime: endTime || new Date(),
      isSubmitted: true,
      status: 'pending'
    });

    await submission.populate('student', 'name');
    await submission.populate('examPaper', 'title');

    // Create activity
    await Activity.create({
      user: req.user?._id,
      action: 'submitted',
      submission: submission._id,
      type: 'result'
    });

    res.status(201).json(submission);
  } catch (error: any) {
    console.error('Error creating submission:', error);
    res.status(500).json({ 
      message: 'Error creating submission',
      error: error.message,
      details: error.errors // Include mongoose validation errors if any
    });
  }
};

interface IEvaluation {
  questionIndex: number;
  marks: number;
  comment?: string;
}

// Evaluate submission
export const evaluateSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { score, evaluations } = req.body as { score: number, evaluations: IEvaluation[] };
    
    if (typeof score !== 'number') {
      return res.status(400).json({ 
        message: 'Score must be a number'
      });
    }

    if (!Array.isArray(evaluations)) {
      return res.status(400).json({
        message: 'Evaluations must be an array'
      });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission with evaluation data
    submission.score = score;
    submission.evaluatedAt = new Date();
    submission.evaluatedBy = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;
    submission.status = 'evaluated';

    // Update individual question evaluations
    evaluations.forEach((evaluation) => {
      const answer = submission.answers.find(a => a.questionIndex === evaluation.questionIndex);
      if (answer) {
        answer.marks = evaluation.marks;
        if (evaluation.comment) {
          answer.comment = evaluation.comment;
        }
      }
    });

    await submission.save();

    // Create activity
    await Activity.create({
      user: req.user?._id,
      action: 'evaluated',
      submission: submission._id,
      type: 'result'
    });

    res.json({ message: 'Evaluation saved successfully', submission });
  } catch (error: any) {
    console.error('Error evaluating submission:', error);
    res.status(500).json({ 
      message: 'Error evaluating submission',
      error: error.message 
    });
  }
};

// Submit to admin
export const submitToAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('examPaper')
      .populate('student');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'evaluated') {
      return res.status(400).json({ message: 'Submission must be evaluated before submitting to admin' });
    }

    // Validate that all required fields are present
    if (!submission.score) {
      return res.status(400).json({ message: 'Submission must have a score before submitting to admin' });
    }

    if (!submission.evaluatedBy) {
      return res.status(400).json({ message: 'Submission must have an evaluator before submitting to admin' });
    }

    // Update submission status
    submission.status = 'submitted_to_admin';
    submission.submittedToAdminAt = new Date();
    
    try {
      await submission.save();
    } catch (saveError: any) {
      console.error('Error saving submission:', saveError);
      return res.status(400).json({ 
        message: 'Error saving submission',
        error: saveError.message,
        details: saveError.errors
      });
    }

    // Create activity
    try {
      await Activity.create({
        user: req.user?._id,
        action: 'submitted_to_admin',
        submission: submission._id,
        type: 'result'
      });
    } catch (activityError: any) {
      console.error('Error creating activity:', activityError);
      // Don't return error here as the main operation succeeded
    }

    res.json({ 
      message: 'Submission sent to admin for review', 
      submission 
    });
  } catch (error: any) {
    console.error('Error submitting to admin:', error);
    res.status(500).json({ 
      message: 'Error submitting to admin',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Publish result (admin only)
export const publishResult = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can publish results' });
    }

    const submission = await Submission.findById(req.params.id)
      .populate('examPaper')
      .populate('student');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'submitted_to_admin') {
      return res.status(400).json({ message: 'Only submissions sent to admin can be published' });
    }

    // Create result document
    const result = await Result.create({
      examPaper: submission.examPaper._id,
      student: submission.student,
      submission: submission._id,
      score: submission.score || 0,
      totalMarks: (submission.examPaper as any).totalMarks,
      percentage: ((submission.score || 0) / (submission.examPaper as any).totalMarks) * 100,
      feedback: submission.feedback
    });

    // Update submission status
    submission.status = 'published';
    submission.publishedAt = new Date();
    await submission.save();

    // Create activity
    await Activity.create({
      user: req.user?._id,
      action: 'published',
      submission: submission._id,
      type: 'result'
    });

    res.json({ 
      message: 'Result published successfully', 
      submission,
      result 
    });
  } catch (error: any) {
    console.error('Error publishing result:', error);
    res.status(500).json({ 
      message: 'Error publishing result',
      error: error.message 
    });
  }
}; 
