import { Request, Response } from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

// Utility to generate a custom message for ticket history
function getHistoryMessage({
  field,
  user,
}: {
  field: string;
  user?: { name?: string; email?: string };
}) {
  const userName = user?.name || user?.email || 'Someone';
  switch (field) {
    case 'CREATED':
      return `${userName} created the ticket`;
    case 'TITLE':
      return `${userName} changed the title`;
    case 'PRIORITY':
      return `${userName} changed the priority`;
    case 'ASSIGNEE':
      return `${userName} changed the assignee`;
    case 'STATUS':
      return `${userName} changed the status`;
    case 'COMMENT_ADDED':
      return `${userName} added a comment`;
    case 'COMMENT_EDITED':
      return `${userName} edited a comment`;
    case 'COMMENT_DELETED':
      return `${userName} deleted a comment`;
    default:
      return `${userName} updated the ticket`;
  }
}

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
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
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
        status: 'Backlog',
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
    const historyEntries: Prisma.TicketHistoryCreateManyInput[] = [];
    const user = (await prisma.user.findUnique({ where: { id: userId } })) || undefined;
    historyEntries.push({
      ticketId: ticket.id,
      field: 'STATUS',
      newValue: 'Backlog',
      userId,
      message: getHistoryMessage({ field: 'STATUS', user }),
    });

    historyEntries.push({
      ticketId: ticket.id,
      field: 'CREATED',
      newValue: title,
      userId,
      message: getHistoryMessage({ field: 'CREATED', user }),
    });

    if (historyEntries.length > 0) {
      await prisma.ticketHistory.createMany({ data: historyEntries });
    }

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
        history: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: true,
          },
        },
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

    const historyEntries: Prisma.TicketHistoryCreateManyInput[] = [];
    const user = (await prisma.user.findUnique({ where: { id: userId } })) || undefined;
    if (title !== undefined && title !== ticket.title) {
      historyEntries.push({
        ticketId,
        field: 'TITLE',
        oldValue: ticket.title,
        newValue: title,
        userId,
        message: getHistoryMessage({ field: 'TITLE', user }),
      });
    }

    if (priority !== undefined && priority !== ticket.priority) {
      historyEntries.push({
        ticketId,
        field: 'PRIORITY',
        oldValue: ticket.priority,
        newValue: priority,
        userId,
        message: getHistoryMessage({ field: 'PRIORITY', user }),
      });
    }

    if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
      const oldAssignee = ticket.assigneeId
        ? await prisma.user.findUnique({ where: { id: ticket.assigneeId } })
        : null;
      const newAssignee = assigneeId
        ? await prisma.user.findUnique({ where: { id: assigneeId } })
        : null;
      historyEntries.push({
        ticketId,
        field: 'ASSIGNEE',
        oldValue: oldAssignee ? oldAssignee.email : null,
        newValue: newAssignee ? newAssignee.email : null,
        userId,
        message: getHistoryMessage({ field: 'ASSIGNEE', user }),
      });
    }

    if (columnId !== undefined && columnId !== ticket.columnId) {
      const oldColumn = await prisma.column.findUnique({
        where: { id: ticket.columnId },
      });
      const newColumn = await prisma.column.findUnique({
        where: { id: columnId },
      });

      historyEntries.push({
        ticketId: ticketId,
        field: 'STATUS',
        oldValue: oldColumn?.name || 'Unknown',
        newValue: newColumn?.name || 'Unknown',
        userId,
        message: getHistoryMessage({ field: 'STATUS', user }),
      });
    }

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

    if (historyEntries.length > 0) {
      await prisma.ticketHistory.createMany({ data: historyEntries });
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

    const user = (await prisma.user.findUnique({ where: { id: userId } })) || undefined;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        field: 'COMMENT_ADDED',
        newValue: content,
        userId,
        commentId: comment.id,
        message: getHistoryMessage({ field: 'COMMENT_ADDED', user }),
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

export const editComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.ticketId !== ticketId) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if (comment.userId !== userId) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: { user: true },
    });
    const user = (await prisma.user.findUnique({ where: { id: userId } })) || undefined;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        field: 'COMMENT_EDITED',
        oldValue: comment.content,
        newValue: content,
        userId,
        commentId,
        message: getHistoryMessage({ field: 'COMMENT_EDITED', user }),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error editing comment' });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, commentId } = req.params;
    const userId = (req as any).user.id;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.ticketId !== ticketId) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if (comment.userId !== userId) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    await prisma.comment.delete({ where: { id: commentId } });
    const user = (await prisma.user.findUnique({ where: { id: userId } })) || undefined;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        field: 'COMMENT_DELETED',
        oldValue: comment.content,
        userId,
        message: getHistoryMessage({ field: 'COMMENT_DELETED', user }),
      },
    });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};
