import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  googleLogin,
  listUsers,
  editUser,
  getNotifications,
  markAllNotificationsRead,
  markNotificationReadById,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login,
);

router.get('/me', authenticateToken, getCurrentUser);

router.put('/me', authenticateToken, upload.single('profileImage'), editUser);

router.post('/google', googleLogin);

router.get('/users', authenticateToken, listUsers);
router.get('/notifications', authenticateToken, getNotifications);
router.patch('/notifications/read', authenticateToken, markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticateToken, markNotificationReadById);

export default router;
