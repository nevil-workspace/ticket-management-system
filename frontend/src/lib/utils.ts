import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getHistoryMessage(h: { field: string; user?: { name?: string; email?: string } }) {
  const userName = h.user?.name || h.user?.email || 'Someone';
  switch (h.field) {
    case 'CREATED':
      return `${userName} created the ticket`;
    case 'TITLE':
      return `${userName} changed the title`;
    case 'PRIORITY':
      return `${userName} changed the priority`;
    case 'ASSIGNEE':
      return `${userName} changed the assignee`;
    case 'STATUS':
      return `${userName} changed the status`;
    case 'COMMENT_ADDED':
      return `${userName} added a comment`;
    case 'COMMENT_EDITED':
      return `${userName} edited a comment`;
    case 'COMMENT_DELETED':
      return `${userName} deleted a comment`;
    default:
      return `${userName} updated the ticket`;
  }
}
