import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { boardAPI, userAPI } from '@/lib/api';
import toast from '@/lib/toast';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { UserMultiSelect } from '@/components/ui/user-multiselect';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const boardSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(2, { message: 'Description is required' }),
  memberIds: z.array(z.string()).min(1, { message: 'At least one member is required' }),
});
type BoardFormData = z.infer<typeof boardSchema>;

export function NewBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    userAPI
      .listUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false));
  }, []);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, errors },
    watch,
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: '',
      description: '',
      memberIds: user ? [user.id] : [],
    },
  });

  useEffect(() => {
    if (user && watch('memberIds').length === 0) {
      setValue('memberIds', [user.id]);
    }
  }, [user, setValue, watch]);

  const onSubmit = async (formData: BoardFormData) => {
    try {
      await boardAPI.createBoard(formData);
      toast.success('Board created successfully');
      navigate('/boards');
    } catch {
      toast.error('Failed to create board');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Board</h1>
        <p className="text-gray-500">Create a new board to organize your tickets</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="name"
                type="text"
                {...field}
                required
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
              />
            )}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
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
          <Controller
            name="memberIds"
            control={control}
            render={({ field }) => (
              <UserMultiSelect
                users={users}
                value={field.value}
                onChange={field.onChange}
                label="Board Members"
                disabled={isSubmitting || loadingUsers}
              />
            )}
          />
          {errors.memberIds && <p className="text-xs text-red-500">{errors.memberIds.message}</p>}
        </div>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/boards')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Board'}
          </Button>
        </div>
      </form>
    </div>
  );
}
