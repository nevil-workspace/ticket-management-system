import { Moon, Sun, LogOut, Pencil, Search } from 'lucide-react';
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
import { useEffect, useCallback } from 'react';
import { ticketAPI } from '@/lib/api';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { showToast } from '@/lib/toast';

interface User {
  id: string;
  name: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  boardId: string;
}

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const trimmedSearch = search.trim();
    if (trimmedSearch === '') {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(() => {
      setSearchLoading(true);

      ticketAPI
        .searchTickets(trimmedSearch)
        .then((tickets) => {
          setSearchResults([...tickets]);
        })
        .catch((error) => {
          console.error(error);
          showToast.error('Something went wrong!');
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback((ticketId: string) => {
    window.open(`/tickets/${ticketId}`, '_blank');
    setCommandOpen(false);
  }, []);

  // Keyboard shortcut label
  // @ts-ignore
  const isMac = navigator.userAgentData?.platform?.toLowerCase().includes('mac') ?? false;
  const shortcutLabel = isMac ? (
    <>
      <span
        className={`font-mono text-xs px-1.5 ${theme === 'dark' ? 'bg-muted' : 'bg-primary'} py-0.5 rounded mr-1`}
      >
        ⌘
      </span>
      <span
        className={`font-mono text-xs ${theme === 'dark' ? 'bg-muted' : 'bg-primary'} px-1.5 py-0.5 rounded`}
      >
        K
      </span>
    </>
  ) : (
    <>
      <span
        className={`font-mono text-xs px-1.5 ${theme === 'dark' ? 'bg-muted' : 'bg-primary'} py-0.5 rounded mr-1`}
      >
        Ctrl
      </span>
      <span
        className={`font-mono text-xs ${theme === 'dark' ? 'bg-muted' : 'bg-primary'} px-1.5 py-0.5 rounded`}
      >
        K
      </span>
    </>
  );

  return (
    <header className="border-b">
      <div className="w-full px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1
            className="text-xl sm:text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            Ticket Management
          </h1>
          {user && (
            <nav className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/boards')}>
                Boards
              </Button>
            </nav>
          )}
        </div>
        <div
          className={`flex items-center ${user ? 'justify-center' : 'justify-end'} gap-4 min-w-[120px]`}
        >
          {user && (
            <>
              <div className="relative w-72 hidden md:block">
                <Button
                  type="button"
                  aria-label="Search tickets (Ctrl+K)"
                  className="w-full"
                  onClick={() => setCommandOpen(true)}
                  tabIndex={0}
                  style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                >
                  <div className="flex items-center w-full">
                    <Input
                      readOnly
                      tabIndex={-1}
                      className="pr-24 cursor-pointer select-none"
                      placeholder="Search tickets..."
                    />
                    <span className="absolute right-2 flex items-center gap-1">
                      {shortcutLabel}
                    </span>
                  </div>
                </Button>
              </div>

              <Button
                type="button"
                aria-label="Search tickets"
                className="md:hidden items-center flex"
                variant="ghost"
                size="icon"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>

              <CommandDialog
                open={commandOpen}
                onOpenChange={setCommandOpen}
                title="Search Tickets"
                description="Search tickets by title or description"
              >
                <CommandInput
                  placeholder="Search tickets..."
                  value={search}
                  onValueChange={setSearch}
                  autoFocus
                />
                <CommandList>
                  {searchLoading && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Searching...
                    </div>
                  )}
                  {!searchLoading && search && searchResults.length === 0 && (
                    <CommandEmpty>No tickets found.</CommandEmpty>
                  )}
                  {searchResults.map((ticket) => (
                    <CommandItem
                      key={ticket.id}
                      onSelect={() => handleSelect(ticket.id)}
                      value={ticket.title + ' ' + ticket.description}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{ticket.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandDialog>
            </>
          )}
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            )}
          </Button>
          {user && (
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
          )}
        </div>
      </div>
    </header>
  );
}
