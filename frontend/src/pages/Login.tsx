import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from '@/lib/toast';
import { GoogleLogin } from '@react-oauth/google';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData: LoginFormData) => {
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful');
      navigate('/boards');
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="mx-auto max-w-md w-full space-y-6 px-2 sm:px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Login</h1>
        <p className="text-gray-500">Enter your credentials to access your account</p>
      </div>
      <div className="flex flex-col items-center space-y-4 w-full">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              try {
                await login(undefined, undefined, credentialResponse.credential);
                toast.success('Login successful');
                navigate('/boards');
              } catch (e) {
                toast.error('Google login failed');
              }
            }
          }}
          onError={() => toast.error('Google login failed')}
        />
        <span className="text-gray-400 text-xs">or</span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
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
                className="w-full"
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
                className="w-full"
              />
            )}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
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
