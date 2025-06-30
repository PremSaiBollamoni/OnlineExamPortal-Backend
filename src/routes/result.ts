import express from 'express';
import { getResults, getResult, getResultStats } from '../controllers/result';
import { authenticate, checkRole } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .get(authenticate, getResults);

router.route('/stats')
  .get(authenticate, checkRole(['faculty', 'admin']), getResultStats);

router.route('/:id')
  .get(authenticate, getResult);

export default router; 