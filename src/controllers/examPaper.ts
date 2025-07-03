import { Request, Response } from 'express';
import ExamPaper from '../models/ExamPaper';
import Subject from '../models/Subject';
import { AuthRequest, ApiError } from '../types';
import Submission from '../models/Submission';
import { createActivity } from './activity';

// Create exam paper
export const createExamPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, subject, duration, totalMarks, passingMarks, questions, instructions } = req.body;

    // Get subject details first
    const subjectDetails = await Subject.findById(subject);
    if (!subjectDetails) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const examPaper = await ExamPaper.create({
      title,
      description,
      subject,
      facultyId: req.user?._id,
      department: subjectDetails.department,    // Get from subject
      specialization: subjectDetails.specialization,  // Get from subject
      duration,
      totalMarks,
      passingMarks,
      questions,
      instructions,
      status: 'pending'
    });

    const populatedPaper = await examPaper.populate(['subject', 'facultyId']);

    // Create activity
    await createActivity(
      req.user?._id || '',
      `Created exam paper: ${title}`,
      'paper'
    );

    res.status(201).json(populatedPaper);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 400).json({ 
      message: apiError.message || 'Failed to create exam paper' 
    });
  }
};

// Get all exam papers
export const getExamPapers = async (req: AuthRequest, res: Response) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user?.role === 'faculty') {
      query = { facultyId: req.user._id };
    } else if (req.user?.role === 'student') {
      // Get student's details
      const studentSemester = req.user.semester;
      const studentDepartment = req.user.department;
      const studentSpecialization = req.user.specialization;

      console.log('Student details:', {
        semester: studentSemester,
        department: studentDepartment,
        specialization: studentSpecialization
      });

      // Find subjects for the student's semester and department
      const subjects = await Subject.find({
        semester: studentSemester,
        department: studentDepartment,
        $or: [
          { specialization: studentSpecialization },
          { specialization: 'No Specialization' },
          { specialization: null },
          { specialization: '' }
        ]
      });

      console.log('Found subjects:', subjects.map(s => ({
        id: s._id,
        name: s.name,
        semester: s.semester,
        specialization: s.specialization
      })));

      const subjectIds = subjects.map(subject => subject._id);

      // Then find approved papers for those subjects with time constraints
      const now = new Date();
      query = {
        subject: { $in: subjectIds },
        status: 'approved'
      };

      console.log('Final query:', JSON.stringify(query, null, 2));

      let examPapers = await ExamPaper.find(query)
        .populate({
          path: 'subject',
          select: 'name semester department specialization'
        })
        .populate('facultyId', 'name');

      console.log('Found exam papers before filtering:', examPapers.length);

      // If student, check for submissions and filter papers
      if (req.user?.role === 'student') {
        // Get all submissions for this student
        const submissions = await Submission.find({
          student: req.user._id,
          isSubmitted: true
        }).select('examPaper');

        // Create a Set of submitted exam IDs for faster lookup
        const submittedExamIds = new Set(submissions.map(sub => sub.examPaper.toString()));

        // Filter and transform exam papers
        examPapers = examPapers
          .filter(paper => {
            // Double check the paper's subject matches student's semester and department
            const subject = paper.subject;
            if (!subject) return false;
            
            const matchesSemester = subject.semester === req.user?.semester;
            const matchesDepartment = subject.department === req.user?.department;
            const matchesSpecialization = 
              subject.specialization === req.user?.specialization ||
              !subject.specialization ||
              subject.specialization === 'No Specialization';

            console.log('Paper filtering details:', {
              paperId: paper._id,
              paperTitle: paper.title,
              matchesSemester,
              matchesDepartment,
              matchesSpecialization,
              subjectSemester: subject.semester,
              userSemester: req.user?.semester,
              subjectDepartment: subject.department,
              userDepartment: req.user?.department,
              subjectSpecialization: subject.specialization,
              userSpecialization: req.user?.specialization
            });

            return matchesSemester && matchesDepartment && matchesSpecialization;
          })
          .map(paper => {
            const paperObj = paper.toObject();
            paperObj.isSubmitted = submittedExamIds.has(paper._id.toString());
            paperObj.isAvailable = !paperObj.isSubmitted && 
                                paper.status === 'approved' && 
                                (!paper.startTime || new Date(paper.startTime) <= new Date()) &&
                                (!paper.endTime || new Date(paper.endTime) >= new Date());
            return paperObj;
          });

        console.log('Filtered exam papers:', examPapers.length);
      }

      res.json(examPapers);
    }
  } catch (error: unknown) {
    console.error('Error in getExamPapers:', error);
    const apiError = error as ApiError;
    res.status(apiError.status || 500).json({ 
      message: apiError.message || 'Internal server error' 
    });
  }
};

// Get exam paper by ID
export const getExamPaper = async (req: Request, res: Response) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id)
      .populate('subject', 'name semester')
      .populate('facultyId', 'name');

    if (!examPaper) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    res.json(examPaper);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 500).json({ 
      message: apiError.message || 'Internal server error' 
    });
  }
};

// Update exam paper
export const updateExamPaper = async (req: AuthRequest, res: Response) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    // Only allow faculty to update their own papers and only if status is pending
    if (
      req.user?.role === 'faculty' && 
      examPaper.facultyId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this exam paper' });
    }

    if (examPaper.status !== 'pending' && req.user?.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update approved or rejected exam paper' });
    }

    const updatedExamPaper = await ExamPaper.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['subject', 'facultyId']);

    // Create activity
    if (req.body.status === 'completed') {
      await createActivity(
        req.user?._id || '',
        `Completed exam: ${examPaper.title}`,
        'paper'
      );
    } else {
      await createActivity(
        req.user?._id || '',
        `Updated exam paper: ${examPaper.title}`,
        'paper'
      );
    }

    res.json(updatedExamPaper);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 400).json({ 
      message: apiError.message || 'Failed to update exam paper' 
    });
  }
};

// Delete exam paper
export const deleteExamPaper = async (req: AuthRequest, res: Response) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    // Only allow faculty to delete their own papers and only if status is pending
    if (
      req.user?.role === 'faculty' && 
      examPaper.facultyId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this exam paper' });
    }

    if (examPaper.status !== 'pending' && req.user?.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot delete approved or rejected exam paper' });
    }

    await examPaper.deleteOne();
    res.json({ message: 'Exam paper deleted' });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 500).json({ 
      message: apiError.message || 'Failed to delete exam paper' 
    });
  }
};

// Approve exam paper (admin only)
export const approveExamPaper = async (req: AuthRequest, res: Response) => {
  try {
    const examPaper = await ExamPaper.findById(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    examPaper.status = 'approved';
    examPaper.isActive = true;
    await examPaper.save();

    // Create activity
    await createActivity(
      req.user?._id || '',
      `Approved exam paper: ${examPaper.title}`,
      'paper'
    );

    res.json(examPaper);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 500).json({ 
      message: apiError.message || 'Failed to approve exam paper' 
    });
  }
};

// Reject exam paper (admin only)
export const rejectExamPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const examPaper = await ExamPaper.findById(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ message: 'Exam paper not found' });
    }

    examPaper.status = 'rejected';
    examPaper.rejectionReason = reason;
    await examPaper.save();

    // Create activity
    await createActivity(
      req.user?._id || '',
      `Rejected exam paper: ${examPaper.title}`,
      'paper',
      reason
    );

    res.json(examPaper);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    res.status(apiError.status || 500).json({ 
      message: apiError.message || 'Failed to reject exam paper' 
    });
  }
}; 
