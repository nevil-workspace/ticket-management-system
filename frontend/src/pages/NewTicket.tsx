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
import { useForm } from '@/hooks/useForm';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TicketFormData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
}

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

  const { values, isSubmitting, handleChange, handleSubmit, setValues } = useForm<TicketFormData>({
    initialValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeId: user?.id,
    },
    onSubmit: async (formData) => {
      if (!boardId) return;
      await ticketAPI.createTicket({
        ...formData,
        boardId,
      });
      toast.success('Ticket created successfully');
      navigate(`/boards/${boardId}`);
    },
    onError: (_) => {
      toast.error('Failed to create ticket');
    },
  });

  useEffect(() => {
    if (user && !values.assigneeId) {
      setValues((v) => ({ ...v, assigneeId: user.id }));
    }
  }, [user]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-gray-500">Add a new ticket to your board</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="title"
            type="text"
            value={values.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-medium">
            Priority
          </Label>
          <Select
            value={values.priority}
            onValueChange={(value) =>
              handleChange('priority', value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
            }
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignee" className="text-sm font-medium">
            Assignee
          </Label>
          <Select
            value={values.assigneeId}
            onValueChange={(value) => handleChange('assigneeId', value)}
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
