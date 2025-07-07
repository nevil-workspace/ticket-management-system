import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addComment,
} from '../controllers/ticket.controller';
import { authenticateToken, isBoardMember } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('columnId').notEmpty().withMessage('Column ID is required'),
    body('assigneeId').optional(),
  ],
  createTicket,
);

router.get('/board/:boardId', isBoardMember, getTickets);
router.get('/:ticketId', getTicket);

router.put(
  '/:ticketId',
  [
    body('title').optional(),
    body('description').optional(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('columnId').optional(),
    body('assigneeId').optional(),
  ],
  updateTicket,
);

router.delete('/:ticketId', deleteTicket);

router.post(
  '/:ticketId/comments',
  [body('content').notEmpty().withMessage('Comment content is required')],
  addComment,
);

export default router;
