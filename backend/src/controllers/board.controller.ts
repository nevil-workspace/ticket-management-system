import { Request, Response } from 'express';
import { prisma } from '../index';
import { Column } from '@prisma/client';

export const createBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).user.id;

    const board = await prisma.board.create({
      data: {
        name,
        description,
        members: {
          connect: { id: userId },
        },
        columns: {
          create: [
            { name: 'Backlog', order: 0 },
            { name: 'Ready for Dev', order: 1 },
            { name: 'In Development', order: 2 },
            { name: 'In QA', order: 3 },
            { name: 'Done', order: 4 },
          ],
        },
      },
      include: {
        members: true,
        columns: true,
      },
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Error creating board' });
  }
};

export const getBoards = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const boards = await prisma.board.findMany({
      where: {
        members: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        members: true,
        columns: {
          include: {
            tickets: true,
          },
        },
      },
    });

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching boards' });
  }
};

export const getBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const userId = (req as any).user.id;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        members: true,
        columns: {
          orderBy: {
            order: 'asc',
          },
          include: {
            tickets: {
              include: {
                assignee: true,
                watchers: true,
                comments: {
                  include: {
                    user: true,
                  },
                },
                history: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Error fetching board' });
  }
};

export const updateBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { name, description } = req.body;
    const userId = (req as any).user.id;

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
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        name,
        description,
      },
      include: {
        members: true,
        columns: true,
      },
    });

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: 'Error updating board' });
  }
};

export const deleteBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const userId = (req as any).user.id;

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
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board' });
  }
};

export const createColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { name } = req.body;
    const userId = (req as any).user.id;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        columns: {
          orderBy: {
            order: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Check if board already has 6 columns (maximum limit)
    const columnCount = await prisma.column.count({
      where: { boardId },
    });

    if (columnCount >= 6) {
      res.status(400).json({ message: 'Maximum of 6 columns allowed per board' });
      return;
    }

    // Get the next order number
    const nextOrder = board.columns.length > 0 ? board.columns[0].order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        name,
        order: nextOrder,
        boardId,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    console.error('Error creating column:', error);
    res.status(500).json({ message: 'Error creating column' });
  }
};

export const updateColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId, columnId } = req.params;
    const { name, order } = req.body;
    const userId = (req as any).user.id;

    // Check if user is a member of the board
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
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Check if column exists and belongs to the board
    const existingColumn = await prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
    });

    if (!existingColumn) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    const updateData: Partial<Column> = {};
    if (name !== undefined) updateData.name = name;
    if (order !== undefined) updateData.order = order;

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: updateData,
    });

    res.json(updatedColumn);
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ message: 'Error updating column' });
  }
};

export const deleteColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId, columnId } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a member of the board
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
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Check if column exists and belongs to the board
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
      include: {
        tickets: true,
      },
    });

    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    // Check if column has tickets
    if (column.tickets.length > 0) {
      res.status(400).json({
        message:
          'Cannot delete column with tickets. Please move all tickets to another column first.',
      });
      return;
    }

    // Check if this is the last column (minimum 1 column required)
    const columnCount = await prisma.column.count({
      where: { boardId },
    });

    if (columnCount <= 1) {
      res
        .status(400)
        .json({ message: 'Cannot delete the last column. At least one column is required.' });
      return;
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Error deleting column' });
  }
};

export const reorderColumns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { columnIds } = req.body; // Array of column IDs in new order
    const userId = (req as any).user.id;

    // Check if user is a member of the board
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
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Update column orders
    const updatePromises = columnIds.map((columnId: string, index: number) =>
      prisma.column.update({
        where: { id: columnId },
        data: { order: index },
      }),
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Columns reordered successfully' });
  } catch (error) {
    console.error('Error reordering columns:', error);
    res.status(500).json({ message: 'Error reordering columns' });
  }
};
