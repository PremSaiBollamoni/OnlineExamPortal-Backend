import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, bulkCreateUsers, bulkDeleteUsers } from '../controllers/user';
import { authenticate, checkRole } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .get(authenticate, getUsers)
  .post(authenticate, checkRole(['admin']), createUser);

router.route('/bulk')
  .post(authenticate, checkRole(['admin']), bulkCreateUsers)
  .delete(authenticate, checkRole(['admin']), bulkDeleteUsers);

router.route('/:id')
  .get(authenticate, getUser)
  .patch(authenticate, checkRole(['admin']), updateUser)
  .delete(authenticate, checkRole(['admin']), deleteUser);

export default router; 