import express from 'express';
import { checkRole } from '../middleware/checkRole';
import { authenticate } from '../middleware/auth';
import {
  getSubmissions,
  getSubmission,
  submitExam,
  evaluateSubmission,
  submitToAdmin,
  publishResult
} from '../controllers/submission';

const router = express.Router();

// Get all submissions
router.get('/', authenticate, getSubmissions);

// Get single submission
router.get('/:id', authenticate, getSubmission);

// Create submission (student only)
router.post('/', authenticate, checkRole(['student']), submitExam);

// Evaluate submission (faculty only)
router.put('/:id/evaluate', authenticate, checkRole(['faculty']), evaluateSubmission);

// Submit to admin (faculty only)
router.put('/:id/submit-to-admin', authenticate, checkRole(['faculty']), submitToAdmin);

// Publish result (admin only)
router.put('/:id/publish', authenticate, checkRole(['admin']), publishResult);

export default router; 