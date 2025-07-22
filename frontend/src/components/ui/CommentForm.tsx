import React, { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isMac: boolean;
  posting: boolean;
}

export const CommentForm = React.memo(({ onSubmit, isMac, posting }: CommentFormProps) => {
  const [comment, setComment] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSubmitShortcut =
        (isMac && e.metaKey && e.key === 'Enter') || (!isMac && e.ctrlKey && e.key === 'Enter');

      if (isSubmitShortcut && document.activeElement === areaRef.current) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit(comment.trim());
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 my-4" ref={formRef}>
      <Label htmlFor="comment" className="text-sm font-medium">
        Add a comment
      </Label>
      <Textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        ref={areaRef}
        placeholder="Write your comment..."
        disabled={posting}
        required
      />
      <div className="flex justify-between items-center">
        <Button type="submit" disabled={posting || !comment.trim()}>
          {posting ? 'Posting...' : 'Post'}
        </Button>
        <div className="text-xs text-muted-foreground">
          Press{' '}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-xs">{isMac ? '⌘' : 'Ctrl'}</kbd>{' '}
          + <kbd className="rounded border bg-muted px-1 py-0.5 text-xs">Enter</kbd> to post
        </div>
      </div>
    </form>
  );
});
