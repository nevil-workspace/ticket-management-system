import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { boardAPI } from '@/lib/api';
import toast from '@/lib/toast';
import { useForm } from '@/hooks/useForm';

interface BoardFormData {
  name: string;
  description: string;
}

export function NewBoard() {
  const navigate = useNavigate();

  const { values, isSubmitting, handleChange, handleSubmit } = useForm<BoardFormData>({
    initialValues: {
      name: '',
      description: '',
    },
    onSubmit: async (formData) => {
      await boardAPI.createBoard(formData);
      toast.success('Board created successfully');
      navigate('/boards');
    },
    onError: (_) => {
      toast.error('Failed to create board');
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Board</h1>
        <p className="text-gray-500">Create a new board to organize your tickets</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
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
