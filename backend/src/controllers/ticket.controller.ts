import { Request, Response } from 'express';
import { prisma } from '../index';
import { Ticket } from '@prisma/client';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, priority, boardId, assigneeId } = req.body;
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
        columns: true,
        members: true,
      },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Validate assigneeId is a member of the board
    if (assigneeId && !board.members.some((m) => m.id === assigneeId)) {
      res.status(400).json({ message: 'Assignee must be a board member' });
      return;
    }

    // Get the first column (usually "Backlog" or "To Do")
    const firstColumn = board.columns[0];
    if (!firstColumn) {
      res.status(400).json({ message: 'No columns found in board' });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority,
        status: 'TODO',
        board: {
          connect: { id: boardId },
        },
        column: {
          connect: { id: firstColumn.id },
        },
        assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
        watchers: {
          connect: { id: userId },
        },
      },
      include: {
        assignee: true,
        watchers: true,
        comments: true,
        column: true,
      },
    });

    // Create ticket history
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        field: 'STATUS',
        newValue: 'TODO',
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket' });
  }
};

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const userId = (req as any).user.id;

    const tickets = await prisma.ticket.findMany({
      where: {
        boardId,
        board: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
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
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

export const getTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        board: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
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
    });

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket' });
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { title, description, priority, columnId, assigneeId } = req.body;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        board: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        column: true,
        board: { include: { members: true } },
      },
    });

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Validate assigneeId is a member of the board
    if (assigneeId && !ticket.board.members.some((m) => m.id === assigneeId)) {
      res.status(400).json({ message: 'Assignee must be a board member' });
      return;
    }

    // Prepare update data object, only including provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (columnId !== undefined) updateData.columnId = columnId;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignee: true,
        watchers: true,
        comments: {
          include: {
            user: true,
          },
        },
        column: true,
      },
    });

    console.log('Updated ticket:', updatedTicket);

    // Create ticket history for status changes
    if (columnId !== undefined && columnId !== ticket.columnId) {
      const oldColumn = await prisma.column.findUnique({
        where: { id: ticket.columnId },
      });
      const newColumn = await prisma.column.findUnique({
        where: { id: columnId },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: ticketId,
          field: 'STATUS',
          oldValue: oldColumn?.name || 'Unknown',
          newValue: newColumn?.name || 'Unknown',
        },
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket' });
  }
};

export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        board: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket' });
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        board: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId,
        userId,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};
