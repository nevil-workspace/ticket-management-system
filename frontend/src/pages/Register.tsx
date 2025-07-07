import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from '@/lib/toast';
import { useForm } from '@/hooks/useForm';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const { values, isSubmitting, handleChange, handleSubmit } = useForm<RegisterFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async (formData) => {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully');
      navigate('/boards');
    },
    onError: (_) => {
      toast.error('Failed to create account');
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-gray-500">Enter your details to create your account</p>
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
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </Button>
      </form>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:underline"
          disabled={isSubmitting}
        >
          Login
        </button>
      </div>
    </div>
  );
}
