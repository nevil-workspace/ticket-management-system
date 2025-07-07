import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../controllers/board.controller';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken);

// Board routes
router.post(
  '/',
  [body('name').notEmpty().withMessage('Board name is required'), body('description').optional()],
  createBoard,
);

router.get('/', getBoards);
router.get('/:boardId', getBoard);

router.put('/:boardId', [body('name').optional(), body('description').optional()], updateBoard);

router.delete('/:boardId', deleteBoard);

// Column Routes (Keeping them here as they're more relevant to a Board)
router.post(
  '/:boardId/columns',
  [body('name').notEmpty().withMessage('Column name is required')],
  createColumn,
);

router.put('/:boardId/columns/reorder', [body('columnIds').isArray()], reorderColumns);

router.put(
  '/:boardId/columns/:columnId',
  [body('name').optional(), body('order').optional().isInt()],
  updateColumn,
);

router.delete('/:boardId/columns/:columnId', deleteColumn);

export default router;
