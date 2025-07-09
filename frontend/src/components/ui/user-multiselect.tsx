import * as React from 'react';
import { Checkbox } from './checkbox';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

interface UserMultiSelectProps {
  users: User[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  disabled?: boolean;
}

export function UserMultiSelect({ users, value, onChange, label, disabled }: UserMultiSelectProps) {
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

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        className="mb-2"
      />
      <div className="max-h-48 overflow-y-auto rounded border bg-background divide-y">
        {filtered.length === 0 && (
          <div className="p-2 text-muted-foreground text-sm">No users found</div>
        )}
        {filtered.map((user) => (
          <label
            key={user.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition',
              disabled && 'opacity-50 pointer-events-none',
            )}
          >
            <Checkbox
              checked={value.includes(user.id)}
              onCheckedChange={() => toggle(user.id)}
              disabled={disabled}
              className="shrink-0"
            />
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border"
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold border">
                {user.name[0]}
              </span>
            )}
            <span className="flex flex-col">
              <span className="font-medium text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
