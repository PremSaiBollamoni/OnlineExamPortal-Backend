import express from 'express';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject';
import { authenticate, checkRole } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .get(authenticate, getSubjects)
  .post(authenticate, checkRole(['faculty', 'admin']), createSubject);

router.route('/:id')
  .get(authenticate, getSubject)
  .patch(authenticate, checkRole(['faculty', 'admin']), updateSubject)
  .delete(authenticate, checkRole(['faculty', 'admin']), deleteSubject);

export default router; 