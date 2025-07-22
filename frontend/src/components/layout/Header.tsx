import { Moon, Sun, LogOut, Pencil, Search, Bell, ArrowUpRight, Loader2 } from 'lucide-react';
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
import { socket } from '@/lib/api';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { showToast } from '@/lib/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { notificationAPI } from '@/lib/api';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [_, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = async (page = 1) => {
    setNotifLoading(true);
    try {
      const data = await notificationAPI.getNotifications(page);
      setNotifications((prev) => {
        // Deduplicate by id
        const all = [...prev, ...data];
        const seen = new Set();
        return all.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      });
      setNotifHasMore(data.length === 20);
    } catch {
      setNotifHasMore(false);
    } finally {
      setNotifLoading(false);
    }
  };

  // Fetch on open
  useEffect(() => {
    if (notifOpen && notifications.length === 0) {
      fetchNotifications(1);
      setNotifPage(1);
    }
  }, [notifOpen]);

  // Fetch notifications on mount if user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications(1);
      setNotifPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTicketUpdate = (notif: any) => {
    setNotifications((prev) => [notif, ...prev]);
  };
  const handleTicketComment = (notif: any) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  // Real-time notification merge
  useEffect(() => {
    if (!user) return;

    socket.on('ticket:updated', handleTicketUpdate);
    socket.on('ticket:comment', handleTicketComment);

    return () => {
      socket.off('ticket:updated', handleTicketUpdate);
      socket.off('ticket:comment', handleTicketComment);
    };
  }, [user]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          {user && (
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span
                      className="min-w-[1.25rem] h-5 text-xs flex items-center justify-center rounded-full absolute z-10 border-2 border-background bg-red-500 text-white font-bold shadow"
                      style={{ transform: 'translate(40%, -40%)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" align="end">
                <div className="p-2 border-b font-semibold">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {notifLoading ? (
                      <span className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="animate-spin w-4 h-4 opacity-80" />
                        <span className="text-xs font-medium">Loading notifications...</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No notifications</span>
                    )}
                  </div>
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        className="w-full text-left text-red-600 hover:text-red-700"
                        onClick={async () => {
                          await notificationAPI.markAllRead();
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                      >
                        Mark all as read
                      </Button>
                    )}
                    <ul className="divide-y">
                      {notifications.map((notif, idx) => (
                        <li
                          key={idx}
                          className={`p-3 hover:bg-accent cursor-pointer ${!notif.read ? 'font-semibold bg-muted/30' : 'text-muted-foreground'}`}
                          onClick={async () => {
                            if (!notif.read) {
                              await notificationAPI.markRead(notif.id);
                              setNotifications((prev) =>
                                prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
                              );
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {notif.title || notif.message || 'Ticket updated'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {notif.time || ''}
                              </div>
                            </div>
                            {notif.ticketId && (
                              <Button
                                className="ml-2 p-1 rounded hover:bg-accent transition"
                                aria-label="Open ticket"
                                type="button"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/tickets/${notif.ticketId}`, '_blank');
                                }}
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {notifHasMore && (
                  <Button
                    variant="link"
                    className="w-full p-2 text-center flex items-center justify-center gap-2 disabled:opacity-60 text-primary hover:underline"
                    onClick={() => {
                      setNotifPage((p) => {
                        fetchNotifications(p + 1);
                        return p + 1;
                      });
                    }}
                    disabled={notifLoading}
                  >
                    {notifLoading && <Loader2 className="animate-spin w-4 h-4 opacity-80" />}
                    <span className="text-xs font-medium">
                      {notifLoading ? 'Loading...' : 'Load more'}
                    </span>
                  </Button>
                )}
              </PopoverContent>
            </Popover>
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
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border"
                      style={{ marginRight: '0.5rem' }}
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold border">
                      {user.name[0]}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto" align="start">
                  <DropdownMenuLabel
                    aria-disabled
                    className="!cursor-default !bg-muted/40 !p-3 !rounded-md !mb-1"
                  >
                    <div className="flex flex-row items-center gap-3">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border shadow-sm"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold border">
                          {user.name[0]}
                        </span>
                      )}
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
