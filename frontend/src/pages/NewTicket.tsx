import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { ticketAPI, boardAPI } from '@/lib/api';
import toast from '@/lib/toast';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const ticketSchema = z.object({
  title: z.string().min(2, { message: 'Title is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().min(1, { message: 'Assignee is required' }),
});
type TicketFormData = z.infer<typeof ticketSchema>;

export function NewTicket() {
  const { id: boardId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (boardId) {
      boardAPI
        .getBoard(boardId)
        .then((b) => setMembers(b.members || []))
        .finally(() => setLoadingMembers(false));
    }
  }, [boardId]);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, errors },
    watch,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeId: user?.id || '',
    },
  });

  useEffect(() => {
    if (user && !watch('assigneeId')) {
      setValue('assigneeId', user.id);
    }
  }, [user, setValue, watch]);

  const onSubmit = async (formData: TicketFormData) => {
    try {
      if (!boardId) return;
      await ticketAPI.createTicket({ ...formData, boardId });
      toast.success('Ticket created successfully');
      navigate(`/boards/${boardId}`);
    } catch {
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-gray-500">Add a new ticket to your board</p>
      </div>
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
              <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
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
          {errors.assigneeId && <p className="text-xs text-red-500">{errors.assigneeId.message}</p>}
        </div>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/boards/${boardId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}
