
import { toast as sonnerToast } from "sonner";
import { type ToastProps } from "@/components/ui/toast";

type ToastActionElement = React.ReactElement;

type ToastOptions = {
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

// These are wrappers around the toast functions to provide a consistent API
const useToast = () => {
  return {
    toast: ({ title, description, action, ...props }: ToastProps & { title: string }) => {
      sonnerToast(title, {
        description,
        action,
        ...props,
      });
    },
    
    toasts: [] // This is required for compatibility with existing components
  };
};

// Direct toast function for ease of use
const toast = (options: ToastProps & { title: string }) => {
  sonnerToast(options.title, {
    description: options.description,
    action: options.action,
    variant: options.variant
  });
};

// Add these additional convenience methods for backward compatibility
toast.info = (title: string, options?: ToastOptions) => {
  sonnerToast(title, {
    description: options?.description,
    action: options?.action,
  });
};

toast.error = (title: string, options?: ToastOptions) => {
  sonnerToast.error(title, {
    description: options?.description,
    action: options?.action,
  });
};

toast.success = (title: string, options?: ToastOptions) => {
  sonnerToast.success(title, {
    description: options?.description,
    action: options?.action,
  });
};

toast.warning = (title: string, options?: ToastOptions) => {
  sonnerToast(title, {
    description: options?.description,
    action: options?.action,
    variant: "destructive",
  });
};

export { useToast, toast };
