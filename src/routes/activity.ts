import express from 'express';
import { getActivities } from '../controllers/activity';
import { authenticate, checkRole } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Get recent activities (admin only)
router.route('/')
  .get(checkRole(['admin']), getActivities);

export default router; 