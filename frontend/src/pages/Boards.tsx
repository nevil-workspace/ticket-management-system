import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Edit, Trash2 } from 'lucide-react';
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

interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface EditBoardData {
  name: string;
  description: string;
}

export function Boards() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editData, setEditData] = useState<EditBoardData>({ name: '', description: '' });
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { execute: fetchBoards, loading } = useApi<Board[]>({
    onSuccess: (data) => setBoards(data),
    errorMessage: 'Failed to fetch boards',
    showToast: false,
  });

  useEffect(() => {
    fetchBoards(() => boardAPI.getBoards());
  }, []);

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setEditData({ name: board.name, description: board.description });
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard) return;

    const originalBoards = [...boards];

    // Optimistic update
    setBoards(
      boards.map((board) => (board.id === editingBoard.id ? { ...board, ...editData } : board)),
    );

    try {
      await boardAPI.updateBoard(editingBoard.id, editData);
      setEditingBoard(null);
      toast.success('Board updated successfully');
    } catch (error) {
      // Revert optimistic update
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
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <Dialog open={!!editingBoard} onOpenChange={(open) => !open && setEditingBoard(null)}>
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
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-board-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-board-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingBoard(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Board</Button>
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
