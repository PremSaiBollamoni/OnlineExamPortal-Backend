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

console.log('Setting up subject routes');

// Log all requests to subject routes
router.use((req, res, next) => {
  console.log('=== Subject Route Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  next();
});

router.route('/')
  .get(authenticate, getSubjects)
  .post(authenticate, checkRole(['faculty', 'admin']), createSubject);

router.route('/:id')
  .get(authenticate, getSubject)
  .patch(authenticate, checkRole(['faculty', 'admin']), updateSubject)
  .delete(authenticate, checkRole(['faculty', 'admin']), deleteSubject);

console.log('Subject routes setup complete');

export default router; 
