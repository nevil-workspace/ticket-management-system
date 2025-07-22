import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authentication token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

export const isBoardMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const boardId = req.params.boardId;
    const userId = req.user.id;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!board) {
      res.status(403).json({ message: 'Not authorized to access this board' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking board membership' });
  }
};
