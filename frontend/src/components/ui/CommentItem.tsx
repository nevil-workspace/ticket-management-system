import { useState } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';
import React from 'react';

interface User {
  id: string;
  name: string;
  profileImage?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onEditSubmit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
}

export const CommentItem = React.memo(
  ({ comment, currentUserId, onEditSubmit, onDelete }: CommentItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onEditSubmit(comment.id, editContent);
      setIsEditing(false);
    };

    return (
      <div className="border rounded-lg p-3 bg-card">
        <div className="flex items-center gap-2 mb-1">
          {comment.user.profileImage && (
            <img
              src={comment.user.profileImage}
              alt={comment.user.name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="font-medium">{comment.user.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
          {currentUserId === comment.user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  ...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(true)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              required
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-sm">{comment.content}</div>
        )}

        {confirmDelete && (
          <div className="mt-2 flex gap-2">
            <span>Delete this comment?</span>
            <Button size="sm" variant="destructive" onClick={() => onDelete(comment.id)}>
              Delete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  },
);
