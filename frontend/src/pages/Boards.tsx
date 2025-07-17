import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { boardAPI } from '@/lib/api';
import toast from '@/lib/toast';
import { useApi } from '@/hooks/useApi';
import { userAPI } from '@/lib/api';
import { UserMultiSelect } from '@/components/ui/user-multiselect';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  members?: User[];
}

const editBoardSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  memberIds: z.array(z.string()).min(1, { message: 'At least one member is required' }),
});
type EditBoardData = z.infer<typeof editBoardSchema>;

export function Boards() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const { execute: fetchBoards, loading } = useApi<Board[]>({
    onSuccess: (data) => setBoards(data),
    errorMessage: 'Failed to fetch boards',
    showToast: false,
  });

  const {
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: resetEditForm,
    formState: { isSubmitting: isEditSubmitting, errors: editErrors },
  } = useForm<EditBoardData>({
    resolver: zodResolver(editBoardSchema),
    defaultValues: {
      name: '',
      description: '',
      memberIds: [],
    },
  });

  useEffect(() => {
    fetchBoards(() => boardAPI.getBoards());
    userAPI
      .listUsers()
      .then(setAllUsers)
      .finally(() => setLoadingUsers(false));
  }, []);

  // Find the board being edited
  const editingBoard = editingBoardId ? boards.find((b) => b.id === editingBoardId) : null;

  useEffect(() => {
    if (editingBoard) {
      resetEditForm({
        name: editingBoard.name,
        description: editingBoard.description,
        memberIds: (editingBoard.members || []).map((m: any) => m.id),
      });
    }
  }, [editingBoard, resetEditForm]);

  const handleEditBoard = (board: Board) => {
    setEditingBoardId(board.id);
  };

  const onEditSubmit = async (data: EditBoardData) => {
    if (!editingBoard) return;
    const originalBoards = [...boards];
    setBoards(
      boards.map((board) => (board.id === editingBoard.id ? { ...board, ...data } : board)),
    );
    try {
      const updated = await boardAPI.updateBoard(editingBoard.id, data);
      setBoards(
        boards.map((board) => (board.id === editingBoard.id ? { ...board, ...updated } : board)),
      );
      setEditingBoardId(null);
      toast.success('Board updated successfully');
    } catch (error) {
      setBoards(originalBoards);
      toast.error('Failed to update board');
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    const originalBoards = [...boards];

    // Optimistic update
    setBoards(boards.filter((board) => board.id !== boardToDelete.id));
    setBoardToDelete(null);

    setIsDeleting(true);
    try {
      await boardAPI.deleteBoard(boardToDelete.id);
      toast.success('Board deleted successfully');
    } catch (error) {
      // Revert optimistic update
      setBoards(originalBoards);
      setBoardToDelete(boardToDelete);
      toast.error('Failed to delete board');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="w-full px-0 md:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Boards</h1>
        <Button onClick={() => navigate('/boards/new')}>Create Board</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <div
            key={board.id}
            className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow relative group"
          >
            {/* Desktop hover actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditBoard(board);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoardToDelete(board);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile 3-dot menu */}
            <div className="absolute top-2 right-2 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBoard(board);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setBoardToDelete(board);
                    }}
                    className="text-red-600 focus:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="cursor-pointer" onClick={() => navigate(`/boards/${board.id}`)}>
              <h2 className="text-xl font-semibold pr-16">{board.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{board.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Created on {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingBoard} onOpenChange={(open) => !open && setEditingBoardId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>Update board details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-board-name" className="text-sm font-medium">
                Name
              </Label>
              <Controller
                name="name"
                control={editControl}
                render={({ field }) => (
                  <Input
                    id="edit-board-name"
                    type="text"
                    {...field}
                    disabled={isEditSubmitting}
                    required
                    aria-invalid={!!editErrors.name}
                  />
                )}
              />
              {editErrors.name && <p className="text-xs text-red-500">{editErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-board-description" className="text-sm font-medium">
                Description
              </Label>
              <Controller
                name="description"
                control={editControl}
                render={({ field }) => (
                  <Textarea
                    id="edit-board-description"
                    {...field}
                    disabled={isEditSubmitting}
                    rows={4}
                    aria-invalid={!!editErrors.description}
                  />
                )}
              />
              {editErrors.description && (
                <p className="text-xs text-red-500">{editErrors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Controller
                name="memberIds"
                control={editControl}
                render={({ field }) => (
                  <UserMultiSelect
                    users={allUsers}
                    value={field.value}
                    onChange={field.onChange}
                    label="Board Members"
                    disabled={loadingUsers || isEditSubmitting}
                  />
                )}
              />
              {editErrors.memberIds && (
                <p className="text-xs text-red-500">{editErrors.memberIds.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBoardId(null)}
                disabled={isEditSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditSubmitting}>
                {isEditSubmitting ? 'Updating...' : 'Update Board'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
        onConfirm={handleDeleteBoard}
        title="Delete Board"
        description={`Are you sure you want to delete "${boardToDelete?.name}"? This action cannot be undone and will delete all tickets in this board.`}
        confirmText="Delete Board"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
