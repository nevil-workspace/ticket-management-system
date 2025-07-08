import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            )}
          </Button>
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
