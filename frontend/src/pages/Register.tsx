import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from '@/lib/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      await registerUser(formData.name, formData.email, formData.password);
      toast.success('Account created successfully');
      navigate('/boards');
    } catch {
      toast.error('Failed to create account');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl sm:text-2xl font-bold">Create an Account</h1>
        <p className="text-gray-500">Enter your details to create your account</p>
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
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                id="email"
                type="email"
                {...field}
                required
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
              />
            )}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                id="password"
                type="password"
                {...field}
                required
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
              />
            )}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
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
