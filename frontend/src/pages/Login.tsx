import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from '@/lib/toast';
import { useForm } from '@/hooks/useForm';

interface LoginFormData {
  email: string;
  password: string;
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const { values, isSubmitting, handleChange, handleSubmit } = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (formData) => {
      await login(formData.email, formData.password);
      toast.success('Login successful');
      navigate('/boards');
    },
    onError: (_) => {
      toast.error('Invalid email or password');
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-gray-500">Enter your credentials to access your account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <div className="text-center text-sm">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/register')}
          className="text-primary hover:underline"
          disabled={isSubmitting}
        >
          Register
        </button>
      </div>
    </div>
  );
}
