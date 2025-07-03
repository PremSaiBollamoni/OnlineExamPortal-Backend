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

// Custom logger function
const log = (...args: any[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [subjects]`, ...args);
};

log('Setting up subject routes');

// Test route without authentication
router.get('/test', (req, res) => {
  log('Test route hit');
  res.json({ message: 'Subject routes are working' });
});

// Log all requests to subject routes
router.use((req, res, next) => {
  log('=== Subject Route Request ===');
  log('Method:', req.method);
  log('Path:', req.path);
  log('Headers:', JSON.stringify(req.headers, null, 2));
  log('Query:', JSON.stringify(req.query, null, 2));
  log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Wrap route handlers with logging
const wrapHandler = (handler: express.RequestHandler): express.RequestHandler => {
  return async (req, res, next) => {
    try {
      log(`Executing ${handler.name} handler`);
      await handler(req, res, next);
      log(`Completed ${handler.name} handler`);
    } catch (error) {
      log(`Error in ${handler.name} handler:`, error);
      next(error);
    }
  };
};

router.route('/')
  .get(authenticate, wrapHandler(getSubjects))
  .post(authenticate, checkRole(['faculty', 'admin']), wrapHandler(createSubject));

router.route('/:id')
  .get(authenticate, wrapHandler(getSubject))
  .patch(authenticate, checkRole(['faculty', 'admin']), wrapHandler(updateSubject))
  .delete(authenticate, checkRole(['faculty', 'admin']), wrapHandler(deleteSubject));

log('Subject routes setup complete');

export default router; 
