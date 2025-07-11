import { Moon, Sun, LogOut, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { EditProfileDialog } from '@/components/ui/EditProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

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
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <img
                    src={
                      user.profileImage ??
                      'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*'
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border"
                    style={{ marginRight: '0.5rem' }}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto" align="start">
                  <DropdownMenuLabel
                    aria-disabled
                    className="!cursor-default !bg-muted/40 !p-3 !rounded-md !mb-1"
                  >
                    <div className="flex flex-row items-center gap-3">
                      <img
                        src={
                          user.profileImage ??
                          'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg'
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border shadow-sm"
                      />
                      <div className="flex flex-col min-w-0 flex-grow justify-center">
                        <span className="font-medium text-base leading-tight break-words whitespace-normal">
                          {user.name}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator></DropdownMenuSeparator>
                  <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
                    <Pencil></Pencil> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut></LogOut> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <EditProfileDialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen} />
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
