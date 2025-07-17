import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-muted text-foreground',
        className,
      )}
      {...props}
    />
  );
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

interface UserPickerProps {
  users: User[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  labelClassList?: string;
  disabled?: boolean;
}

export function UserPicker({
  users,
  value,
  onChange,
  label,
  labelClassList,
  disabled,
}: UserPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const clear = () => onChange([]);

  return (
    <div className="space-y-1">
      {label && <Label className={labelClassList}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between min-h-10 h-auto flex-wrap',
              disabled && 'opacity-50 pointer-events-none',
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {value.length === 0 && <span className="text-muted-foreground">Select users...</span>}
              {value.slice(0, 3).map((id) => {
                const user = users.find((u) => u.id === id);
                if (!user) return null;
                return (
                  <Badge
                    key={id}
                    className="flex items-center gap-1 px-2 py-1 bg-muted text-foreground"
                  >
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover border"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold border">
                        {user.name[0]}
                      </span>
                    )}
                    <span className="max-w-[80px] truncate">{user.name}</span>
                  </Badge>
                );
              })}
              {value.length > 3 && (
                <Badge className="bg-muted text-foreground">+{value.length - 3} more</Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput
                placeholder="Search users..."
                value={search}
                onValueChange={setSearch}
                autoFocus
              />
            </div>
            <CommandList>
              {filtered.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    if (value.length === users.length) {
                      clear();
                    } else {
                      onChange(users.map((u) => u.id));
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      value.length === users.length
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50',
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span>(Select All)</span>
                </CommandItem>
                {filtered.map((user) => {
                  const isSelected = value.includes(user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      onSelect={() => toggle(user.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50',
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-5 h-5 rounded-full object-cover border mr-2"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold border mr-2">
                          {user.name[0]}
                        </span>
                      )}
                      <span className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {value.length > 0 && (
                <div className="flex items-center justify-between px-2 py-2 border-t">
                  <Button variant="ghost" size="sm" onClick={clear}>
                    Clear
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
