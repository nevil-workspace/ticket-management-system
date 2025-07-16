import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, boardAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import toast from '@/lib/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { getHistoryMessage } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  boardId: string;
  comments: Comment[];
  history: TicketHistory[];
}

interface TicketHistory {
  id: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user?: User;
  userId?: string;
  commentId?: string;
  message?: string;
}

const ticketSchema = z.object({
  title: z.string().min(2, { message: 'Title is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().min(1, { message: 'Assignee is required' }),
});
type TicketFormData = z.infer<typeof ticketSchema>;

export function TicketDetail() {
  const { user } = useAuth();
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [addingComment, setAddingComment] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState('');

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [members, setMembers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState('comments');

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeId: '',
    },
  });

  const fetchTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const data = await ticketAPI.getTicket(ticketId);
      setTicket(data);
      reset({
        title: data.title,
        description: data.description,
        priority: data.priority,
        assigneeId: data.assignee?.id || '',
      });

      if (data.boardId) {
        setLoadingMembers(true);
        try {
          const board = await boardAPI.getBoard(data.boardId);
          setMembers(board.members || []);
        } catch {
          setMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      }
    } catch (e) {
      toast.error('Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const onEdit = () => setEditMode(true);
  const onCancelEdit = () => {
    if (ticket) {
      reset({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        assigneeId: ticket.assignee?.id || '',
      });
    }
    setEditMode(false);
  };

  const onSubmit = async (formData: TicketFormData) => {
    if (!ticketId) return;
    try {
      await ticketAPI.updateTicket(ticketId, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigneeId: formData.assigneeId,
      });
      toast.success('Ticket updated');
      setEditMode(false);
      fetchTicket();
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !ticketId) return;
    setAddingComment(true);
    try {
      const newComment = await ticketAPI.addComment(ticketId, { content: comment });
      setTicket((prev) => (prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev));
      setComment('');
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const handleEditCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !editingCommentId) return;
    try {
      await ticketAPI.editComment(ticketId, editingCommentId, { content: editingCommentContent });
      setEditingCommentId(null);
      setEditingCommentContent('');
      fetchTicket();
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!ticketId) return;
    try {
      await ticketAPI.deleteComment(ticketId, commentId);
      setDeletingCommentId(null);
      fetchTicket();
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!ticket) {
    return <div className="text-center text-red-500">Ticket not found</div>;
  }

  const history: TicketHistory[] = ticket.history || [];

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/boards/${ticket.boardId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-lg font-medium">Back to Board</span>
      </div>
      <div className="space-y-2">
        {editMode ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    id="title"
                    type="text"
                    {...field}
                    required
                    disabled={isSubmitting}
                    aria-invalid={!!errors.title}
                  />
                )}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="description"
                    {...field}
                    rows={4}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.description}
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
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
                )}
              />
              {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-medium">
                Assignee
              </Label>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || loadingMembers}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}{' '}
                          <span className="text-xs text-muted-foreground">({member.email})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assigneeId && (
                <p className="text-xs text-red-500">{errors.assigneeId.message}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{ticket.title}</h1>
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            </div>
            <p className="text-gray-500">{ticket.description}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="font-bold">Priority: {ticket.priority}</span>
              <span className="font-bold">Status: {ticket.status}</span>
              <span className="font-bold">Assignee: {ticket.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="text-xs text-gray-400">
              Created: {new Date(ticket.createdAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex gap-2 mb-2">
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="comments">
          <h2 className="text-xl font-semibold">Comments</h2>
          <div className="space-y-4">
            {ticket.comments.length === 0 && <div className="text-gray-400">No comments yet.</div>}
            {[...ticket.comments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((c) => (
                <div key={c.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    {c.user.profileImage && (
                      <img
                        src={c.user.profileImage}
                        alt={c.user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="font-medium">{c.user.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                    {user && c.user.id === user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-auto">
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditComment(c.id, c.content)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingCommentId(c.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <form onSubmit={handleEditCommentSubmit} className="space-y-2">
                      <Textarea
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        rows={2}
                        required
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-sm">{c.content}</div>
                  )}
                  {deletingCommentId === c.id && (
                    <div className="mt-2 flex gap-2">
                      <span>Delete this comment?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingCommentId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="space-y-2 mt-4">
            <Label htmlFor="comment" className="text-sm font-medium">
              Add a comment
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Write your comment..."
              disabled={addingComment}
              required
            />
            <Button type="submit" disabled={addingComment || !comment.trim()}>
              {addingComment ? 'Posting...' : 'Post'}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="history">
          <h2 className="text-xl font-semibold mb-2">History</h2>
          <div className="space-y-4">
            {history.length === 0 && <div className="text-gray-400">No history yet.</div>}
            {history
              // .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((h) => {
                const message = h.message || getHistoryMessage(h);
                return (
                  <div key={h.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      {h.user && h.user.profileImage && (
                        <img
                          src={h.user.profileImage}
                          alt={h.user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-sm">{message}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {h.oldValue && h.newValue && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-bold">From:</span> {h.oldValue ?? '—'}{' '}
                        <span className="font-bold">To:</span> {h.newValue ?? '—'}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
