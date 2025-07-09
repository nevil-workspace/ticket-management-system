import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Edit, Trash2, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { boardAPI, ticketAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { useTheme } from '@/hooks/useTheme';
import { UserMultiSelect } from '@/components/ui/user-multiselect';
import { userAPI } from '@/lib/api';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  columnId: string;
  assignee?: { id: string; name: string; email: string };
}

interface Column {
  id: string;
  name: string;
  order: number;
  tickets: Ticket[];
}

interface Board {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  members?: { id: string; name: string; email: string }[];
}

interface EditTicketData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
}

interface EditBoardData {
  name: string;
  description: string;
  memberIds: string[];
}

interface EditColumnData {
  name: string;
}

export function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTicketData, setEditTicketData] = useState<EditTicketData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: undefined,
  });
  const [editingBoard, setEditingBoard] = useState<boolean>(false);
  const [editBoardData, setEditBoardData] = useState<EditBoardData>({
    name: '',
    description: '',
    memberIds: [],
  });
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColumnData, setEditColumnData] = useState<EditColumnData>({
    name: '',
  });
  const [creatingColumn, setCreatingColumn] = useState<boolean>(false);
  const [newColumnName, setNewColumnName] = useState<string>('');
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const themeContext = useTheme();

  useEffect(() => {
    if (id) {
      fetchBoard();

      userAPI
        .listUsers()
        .then(setAllUsers)
        .finally(() => setLoadingUsers(false));
    }
  }, [id]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await boardAPI.getBoard(id!);
      setBoard(data);
    } catch (err) {
      console.error('Failed to fetch board:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch board';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic update helper
  const updateBoardOptimistically = (updater: (board: Board) => Board) => {
    if (board) {
      setBoard(updater(board));
    }
  };

  const handleStatusChange = async (ticketId: string, newColumnId: string) => {
    if (!board) return;

    // Find the ticket and columns
    const ticket = board.columns.flatMap((col) => col.tickets).find((t) => t.id === ticketId);
    const sourceColumn = board.columns.find((col) => col.tickets.some((t) => t.id === ticketId));
    const targetColumn = board.columns.find((col) => col.id === newColumnId);

    if (!ticket || !sourceColumn || !targetColumn) return;

    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      columns: board.columns.map((col) => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            tickets: col.tickets.filter((t) => t.id !== ticketId),
          };
        }
        if (col.id === targetColumn.id) {
          return {
            ...col,
            tickets: [...col.tickets, { ...ticket, columnId: newColumnId }],
          };
        }
        return col;
      }),
    }));

    try {
      await ticketAPI.updateTicket(ticketId, { columnId: newColumnId });
      showToast.success('Ticket moved successfully');
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket status';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      fetchBoard();
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditTicketData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      assigneeId: ticket.assignee?.id || '',
    });
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket || !board) return;

    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        tickets: col.tickets.map((ticket) =>
          ticket.id === editingTicket.id
            ? {
                ...ticket,
                ...editTicketData,
                assignee:
                  board.members?.find((m: any) => m.id === editTicketData.assigneeId) || undefined,
              }
            : ticket,
        ),
      })),
    }));

    try {
      await ticketAPI.updateTicket(editingTicket.id, editTicketData);
      setEditingTicket(null);
      showToast.success('Ticket updated successfully');
    } catch (err) {
      console.error('Failed to update ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      fetchBoard();
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete || !board) return;

    setIsDeletingTicket(true);

    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        tickets: col.tickets.filter((ticket) => ticket.id !== ticketToDelete.id),
      })),
    }));

    try {
      await ticketAPI.deleteTicket(ticketToDelete.id);
      setTicketToDelete(null);
      showToast.success('Ticket deleted successfully');
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ticket';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      fetchBoard();
    } finally {
      setIsDeletingTicket(false);
    }
  };

  const handleEditBoard = () => {
    if (!board) return;
    setEditingBoard(true);
    setEditBoardData({
      name: board.name,
      description: board.description,
      memberIds: board.members?.map((x) => x.id) ?? [],
    });
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;
    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      ...editBoardData,
    }));
    try {
      let updated = await boardAPI.updateBoard(board.id, {
        name: editBoardData.name,
        description: editBoardData.description,
        memberIds: editBoardData.memberIds,
      });

      setBoard((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name ?? prev.name,
              description: updated.description ?? prev.description,
              members: Array.isArray(updated.members) ? updated.members : prev.members,
              // Only replace columns if present in response, else keep previous
              columns: Array.isArray(updated.columns)
                ? updated.columns.map((col: any, idx: number) => ({
                    ...prev.columns[idx],
                    ...col,
                    tickets: Array.isArray(col.tickets)
                      ? col.tickets
                      : prev.columns[idx]?.tickets || [],
                  }))
                : prev.columns,
            }
          : null,
      );
      setEditingBoard(false);
      showToast.success('Board updated successfully');
    } catch (err) {
      console.error('Failed to update board:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update board';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      await fetchBoard();
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !newColumnName.trim()) return;

    try {
      const response = await boardAPI.createColumn(board.id, { name: newColumnName.trim() });

      // Optimistic update with the new column
      updateBoardOptimistically((board) => ({
        ...board,
        columns: [...board.columns, { ...response, tickets: [] }],
      }));

      setCreatingColumn(false);
      setNewColumnName('');
      showToast.success('Column created successfully');
    } catch (err) {
      console.error('Failed to create column:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create column';
      showToast.error(errorMessage);
    }
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setEditColumnData({ name: column.name });
  };

  const handleUpdateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn || !board) return;

    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      columns: board.columns.map((col) =>
        col.id === editingColumn.id ? { ...col, name: editColumnData.name } : col,
      ),
    }));

    try {
      await boardAPI.updateColumn(board.id, editingColumn.id, editColumnData);
      setEditingColumn(null);
      showToast.success('Column updated successfully');
    } catch (err) {
      console.error('Failed to update column:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update column';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      fetchBoard();
    }
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete || !board) return;

    setIsDeletingColumn(true);

    // Optimistic update
    updateBoardOptimistically((board) => ({
      ...board,
      columns: board.columns.filter((col) => col.id !== columnToDelete.id),
    }));

    try {
      await boardAPI.deleteColumn(board.id, columnToDelete.id);
      setColumnToDelete(null);
      showToast.success('Column deleted successfully');
    } catch (err) {
      console.error('Failed to delete column:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete column';
      showToast.error(errorMessage);
      // Revert optimistic update on error
      fetchBoard();
    } finally {
      setIsDeletingColumn(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination || !board) return;

    if (type === 'COLUMN') {
      // Handle column reordering
      const columnIds = Array.from(board.columns.map((col) => col.id));
      const [removed] = columnIds.splice(source.index, 1);
      columnIds.splice(destination.index, 0, removed);

      // Optimistic update
      updateBoardOptimistically((board) => ({
        ...board,
        columns: columnIds.map((id) => board.columns.find((col) => col.id === id)!),
      }));

      try {
        await boardAPI.reorderColumns(board.id, { columnIds });
        showToast.success('Columns reordered successfully');
      } catch (err) {
        console.error('Failed to reorder columns:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to reorder columns';
        showToast.error(errorMessage);
        // Revert optimistic update on error
        fetchBoard();
      }
    } else {
      // Handle ticket movement
      if (source.droppableId !== destination.droppableId) {
        await handleStatusChange(draggableId, destination.droppableId);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500">{error}</div>
        <Button onClick={fetchBoard}>Retry</Button>
      </div>
    );
  }

  if (!board) {
    return <div>Board not found</div>;
  }

  return (
    <TooltipProvider>
      <div className="w-full px-0 md:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{board.name}</h1>
              <p className="text-gray-500">{board.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEditBoard}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {board.columns.length < 6 && (
              <Button variant="outline" onClick={() => setCreatingColumn(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            )}
            <Button onClick={() => navigate(`/boards/${id}/tickets/new`)}>Create Ticket</Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-6 overflow-x-auto pb-4"
              >
                {board.columns.map((column, columnIndex) => (
                  <Draggable key={column.id} draggableId={column.id} index={columnIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`min-w-[300px] ${snapshot.isDragging ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            </div>
                            <h2 className="text-xl font-semibold">{column.name}</h2>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditColumn(column)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {board.columns.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        column.tickets.length === 0 && setColumnToDelete(column)
                                      }
                                      disabled={column.tickets.length > 0}
                                      className={`${
                                        column.tickets.length > 0
                                          ? 'text-gray-400 cursor-not-allowed opacity-50'
                                          : 'text-red-600 hover:text-red-700'
                                      }`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {column.tickets.length > 0 && (
                                  <TooltipContent>
                                    <p>
                                      Cannot delete column with tickets. Move all tickets first.
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-4 min-h-[200px] ${themeContext.theme === 'dark' ? 'bg-card' : 'bg-gray-50'} p-4 rounded-lg ${snapshot.isDraggingOver ? 'ring-2 ring-primary' : ''}`}
                            >
                              {column.tickets.map((ticket, idx) => (
                                <Draggable key={ticket.id} draggableId={ticket.id} index={idx}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`rounded-lg border bg-card p-4 space-y-2 cursor-move hover:shadow-md transition-shadow relative group ${snapshot.isDragging ? 'opacity-70' : ''}`}
                                    >
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditTicket(ticket);
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTicketToDelete(ticket);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <h3 className="font-medium pr-12">{ticket.title}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {ticket.description}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        Priority: {ticket.priority}
                                      </span>
                                      <br />
                                      <span className="text-xs text-muted-foreground">
                                        Assignee: {ticket?.assignee?.email ?? 'Unassigned'}
                                      </span>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Create Column Dialog */}
        <Dialog open={creatingColumn} onOpenChange={(open) => !open && setCreatingColumn(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Column</DialogTitle>
              <DialogDescription>Add a new column to organize your tickets</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-column-name" className="text-sm font-medium">
                  Column Name
                </Label>
                <Input
                  id="new-column-name"
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Enter column name"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreatingColumn(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Column</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Column Dialog */}
        <Dialog open={!!editingColumn} onOpenChange={(open) => !open && setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Column</DialogTitle>
              <DialogDescription>Update the column name</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateColumn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-column-name" className="text-sm font-medium">
                  Column Name
                </Label>
                <Input
                  id="edit-column-name"
                  type="text"
                  value={editColumnData.name}
                  onChange={(e) => setEditColumnData({ name: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingColumn(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Column</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Ticket Dialog */}
        <Dialog open={!!editingTicket} onOpenChange={(open) => !open && setEditingTicket(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Ticket</DialogTitle>
              <DialogDescription>Update the ticket details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  type="text"
                  value={editTicketData.title}
                  onChange={(e) => setEditTicketData({ ...editTicketData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editTicketData.description}
                  onChange={(e) =>
                    setEditTicketData({ ...editTicketData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={editTicketData.priority}
                  onValueChange={(value) =>
                    setEditTicketData({
                      ...editTicketData,
                      priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ticket-assignee" className="text-sm font-medium">
                  Assignee
                </Label>
                <Select
                  value={editTicketData.assigneeId}
                  onValueChange={(value) => setEditTicketData((d) => ({ ...d, assigneeId: value }))}
                  disabled={!board || !board.members || board.members.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {(board?.members || []).map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}{' '}
                        <span className="text-xs text-muted-foreground">({member.email})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTicket(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Board Dialog */}
        <Dialog open={editingBoard} onOpenChange={(open) => !open && setEditingBoard(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
              <DialogDescription>Update board details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateBoard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-board-name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="edit-board-name"
                  type="text"
                  value={editBoardData.name}
                  onChange={(e) => setEditBoardData((d) => ({ ...d, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-board-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="edit-board-description"
                  value={editBoardData.description}
                  onChange={(e) => setEditBoardData((d) => ({ ...d, description: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <UserMultiSelect
                  users={allUsers}
                  value={editBoardData.memberIds}
                  onChange={(ids) => setEditBoardData((d) => ({ ...d, memberIds: ids }))}
                  label="Board Members"
                  disabled={loadingUsers}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingBoard(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Board</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={!!ticketToDelete}
          onClose={() => setTicketToDelete(null)}
          onConfirm={handleDeleteTicket}
          title="Delete Ticket"
          description={`Are you sure you want to delete "${ticketToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete Ticket"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeletingTicket}
        />

        <ConfirmationModal
          isOpen={!!columnToDelete}
          onClose={() => setColumnToDelete(null)}
          onConfirm={handleDeleteColumn}
          title="Delete Column"
          description={`Are you sure you want to delete "${columnToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete Column"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeletingColumn}
        />
      </div>
    </TooltipProvider>
  );
}
