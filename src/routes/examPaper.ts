import express from 'express';
import {
  createExamPaper,
  getExamPapers,
  getExamPaper,
  updateExamPaper,
  deleteExamPaper,
  approveExamPaper,
  rejectExamPaper
} from '../controllers/examPaper';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

// Base route: /api/exam-papers

// Public routes
router.get('/', authenticate, getExamPapers);
router.get('/:id', authenticate, getExamPaper);

// Faculty routes
router.post('/', authenticate, checkRole(['faculty']), createExamPaper);
router.put('/:id', authenticate, checkRole(['faculty', 'admin']), updateExamPaper);
router.delete('/:id', authenticate, checkRole(['faculty', 'admin']), deleteExamPaper);

// Admin routes
router.post('/:id/approve', authenticate, checkRole(['admin']), approveExamPaper);
router.post('/:id/reject', authenticate, checkRole(['admin']), rejectExamPaper);

export default router; 