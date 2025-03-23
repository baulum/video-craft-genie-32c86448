
import { toast as sonnerToast, type ToastT } from "sonner";

// We need to modify our toast API to match Sonner's expectations
const useToast = () => {
  return {
    toast: (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
      // Map our custom props to Sonner's expected format
      if (props.variant === "destructive") {
        sonnerToast.error(props.title, {
          description: props.description,
        });
      } else {
        sonnerToast(props.title, {
          description: props.description,
        });
      }
    },
    
    toasts: [] // This is required for compatibility with existing components
  };
};

// Direct toast function for ease of use
const toast = (title: string, options?: { description?: string; variant?: "default" | "destructive" }) => {
  if (options?.variant === "destructive") {
    sonnerToast.error(title, {
      description: options?.description,
    });
  } else {
    sonnerToast(title, {
      description: options?.description,
    });
  }
};

// Add these additional convenience methods for backward compatibility
toast.info = (title: string, options?: { description?: string }) => {
  sonnerToast.info(title, {
    description: options?.description,
  });
};

toast.error = (title: string, options?: { description?: string }) => {
  sonnerToast.error(title, {
    description: options?.description,
  });
};

toast.success = (title: string, options?: { description?: string }) => {
  sonnerToast.success(title, {
    description: options?.description,
  });
};

toast.warning = (title: string, options?: { description?: string }) => {
  sonnerToast.warning(title, {
    description: options?.description,
  });
};

export { useToast, toast };
