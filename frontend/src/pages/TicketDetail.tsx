import { useEffect, useState, useRef } from 'react';
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
import { CommentItem } from '@/components/ui/CommentItem';
import { CommentForm } from '@/components/ui/CommentForm';
import { useAuth } from '@/hooks/useAuth';
import { getHistoryMessage } from '@/lib/utils';
import { socket } from '@/lib/api';

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
  assigneeId?: string;
  boardId: string;
  comments: Comment[];
  history: TicketHistory[];
  watchers: User[];
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
  const [postingComment, setPostingComment] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [members, setMembers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState('comments');

  const [watching, setWatching] = useState(false);

  const [isMac, _] = useState<boolean>(
    // @ts-ignore
    navigator.userAgentData?.platform?.toLowerCase().includes('mac') ?? false,
  );

  const commentFormRef = useRef<HTMLFormElement | null>(null);
  const commentAreaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (ticket && user) {
      setWatching(ticket.watchers.some((w) => w.id === user.id));
    }
  }, [ticket, user]);

  // listen to watchers update on socket
  useEffect(() => {
    if (!ticketId) return;
    const handleWatchersUpdate = (data: any) => {
      if (data.ticketId === ticketId) {
        setTicket((prev) => (prev ? { ...prev, watchers: data.watchers } : prev));
      }
    };
    socket.on('ticket:watchers-updated', handleWatchersUpdate);
    return () => {
      socket.off('ticket:watchers-updated', handleWatchersUpdate);
    };
  }, [ticketId]);

  // listen to ticket update on socket
  useEffect(() => {
    if (!ticketId) return;

    const handleTicketUpdate = (notif: any, ticketData: any) => {
      if (notif.ticketId === ticketId && ticketData) {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                ...ticketData,
              }
            : ticketData,
        );
      }
    };

    const handleNewComment = (notif: any, newComment: any) => {
      if (notif.ticketId === ticketId) {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                comments: [newComment, ...prev.comments],
              }
            : prev,
        );
      }
    };

    socket.on('ticket:updated', handleTicketUpdate);
    socket.on('ticket:comment', handleNewComment);
    return () => {
      socket.off('ticket:updated', handleTicketUpdate);
      socket.off('ticket:comment', handleNewComment);
    };
  }, [ticketId]);

  useEffect(() => {
    if (editMode && ticket) {
      reset({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        assigneeId: ticket.assignee?.id || '',
      });
    }
  }, [ticket, editMode, reset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSubmitShortcut =
        (isMac && e.metaKey && e.key === 'Enter') || (!isMac && e.ctrlKey && e.key === 'Enter');

      if (isSubmitShortcut) {
        const active = document.activeElement;
        if (active === commentAreaRef.current) {
          e.preventDefault();
          commentFormRef.current?.requestSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleWatchToggle = async () => {
    if (!ticketId) return;
    try {
      if (watching) {
        await ticketAPI.removeWatcher(ticketId);
        setWatching(false);
      } else {
        await ticketAPI.addWatcher(ticketId);
        setWatching(true);
      }
    } catch {
      toast.error('Failed to update watch status');
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
    <div className="max-w-2xl mx-auto py-8 space-y-8 px-2 sm:px-4 w-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex justify-center items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/boards/${ticket.boardId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-base sm:text-lg font-medium">Back to Board</span>
        </div>
        {!editMode && (
          <Button variant="outline" size="sm" onClick={onEdit} className="w-auto block md:hidden">
            Edit
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {editMode ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
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
                    aria-invalid={!!errors.title}
                    className="w-full"
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
                    aria-invalid={!!errors.description}
                    className="w-full"
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
                    key={field.value}
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
              <Label htmlFor="assigneeId" className="text-sm font-medium">
                Assignee
              </Label>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select
                    key={field.value}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex gap-2 sm:flex-row sm:gap-4 items-start sm:items-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">
                {ticket.title}
              </h1>
              <Button
                variant={watching ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleWatchToggle}
              >
                {watching ? 'Unwatch' : 'Watch'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="w-auto hidden md:block"
              >
                Edit
              </Button>
            </div>

            <p className="text-gray-500 break-words">{ticket.description}</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4 text-sm text-muted-foreground">
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
          {/* New Comment Secition */}
          <CommentForm
            isMac={isMac}
            posting={postingComment}
            onSubmit={async (value) => {
              if (!ticketId) return;
              setPostingComment(true);
              try {
                const newComment = await ticketAPI.addComment(ticketId, { content: value });
                setTicket((prev) =>
                  prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev,
                );
                toast.success('Comment added');
              } catch (e) {
                toast.error('Failed to add comment');
              } finally {
                setPostingComment(false);
              }
            }}
          />

          <h2 className="text-xl font-semibold mb-2">Comments</h2>
          <div className="space-y-4">
            {ticket.comments.length === 0 && <div className="text-gray-400">No comments yet.</div>}
            {[...ticket.comments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={user?.id}
                  onEditSubmit={async (id, content) => {
                    if (!ticketId) return;
                    try {
                      await ticketAPI.editComment(ticketId, id, { content });
                      // optimistic update
                      setTicket((prev) =>
                        prev
                          ? {
                              ...prev,
                              comments: prev.comments.map((comment) =>
                                comment.id === id ? { ...comment, content } : comment,
                              ),
                            }
                          : prev,
                      );

                      toast.success('Comment updated');
                    } catch {
                      toast.error('Failed to update comment');
                      fetchTicket(); // refetch on error
                    }
                  }}
                  onDelete={async (id) => {
                    if (!ticketId) return;
                    try {
                      await ticketAPI.deleteComment(ticketId, id);

                      // optimistic update
                      setTicket((prev) =>
                        prev
                          ? {
                              ...prev,
                              comments: prev.comments.filter((comment) => comment.id !== id),
                            }
                          : prev,
                      );
                      toast.success('Comment deleted');
                    } catch {
                      toast.error('Failed to delete comment');
                      fetchTicket(); // refetch on error
                    }
                  }}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="history">
          <h2 className="text-xl font-semibold mb-2">History</h2>
          <div className="space-y-4">
            {history.length === 0 && <div className="text-gray-400">No history yet.</div>}
            {history.map((h) => {
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
