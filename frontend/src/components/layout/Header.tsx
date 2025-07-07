import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.tsx';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="w-full px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            Ticket Management
          </h1>
          {user && (
            <nav className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/boards')}>
                Boards
              </Button>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
