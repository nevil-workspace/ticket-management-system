import { useState, ChangeEvent, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { userAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import showToast from '@/lib/toast';
import { Button } from '@/components/ui/button';

export function EditProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.profileImage || null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 3 * 1024 * 1024) {
        setError('Profile picture must be less than 3MB');
        setFile(null);
        setPreview(user?.profileImage || null);
        return;
      }
      setFile(selected);
      setError(null);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (file) formData.append('profileImage', file);
      await userAPI.editUser(formData);
      await refreshUser();
      showToast.success('Profile updated successfully!');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      showToast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
            <DialogDescription className="text-gray-500">
              Update your name and profile picture (max 3MB).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 mb-2">
              {preview ? (
                <img src={preview} alt="Profile preview" className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <label className="w-full flex flex-col gap-1">
              <span className="font-medium">Name</span>
              <input
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="w-full flex flex-col gap-1">
              <span className="font-medium">Profile Picture</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <DialogFooter className="flex gap-2 justify-end border-t pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
