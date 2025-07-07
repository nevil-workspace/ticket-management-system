import { toast } from 'sonner';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  },

  warning: (message: string) => {
    toast.warning(message, {
      duration: 4000,
      position: 'top-right',
    });
  },

  info: (message: string) => {
    toast.info(message, {
      duration: 3000,
      position: 'top-right',
    });
  },
};

export default showToast;
