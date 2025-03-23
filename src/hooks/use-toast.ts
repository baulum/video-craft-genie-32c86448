import { type ToastActionElement, type ToastProps } from "@/components/ui/toast"
import { toast as sonnerToast, Toaster } from "sonner"

const TOAST_LIMIT = 20

// Define type for shadcn toast to avoid circular reference
export type ShadcnToastType = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type ToasterToast = Omit<ShadcnToastType, "id"> & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | null
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & { id: string }
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        if (toastTimeouts.has(toastId)) {
          clearTimeout(toastTimeouts.get(toastId))
          toastTimeouts.delete(toastId)
        }
      } else {
        for (const [id, timeout] of toastTimeouts.entries()) {
          clearTimeout(timeout)
          toastTimeouts.delete(id)
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Helper type for toast function
type ToastParams = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
} | string;

// Main toast function that handles both string and object inputs
function toast(params: ToastParams, options?: any) {
  if (typeof params === 'string') {
    return sonnerToast(params, options);
  }
  
  // Handle object format
  const { title, description, variant } = params as { 
    title: string; 
    description?: string; 
    variant?: "default" | "destructive" 
  };
  
  if (variant === 'destructive') {
    return sonnerToast.error(title, { description, ...options });
  }
  
  return sonnerToast(title, { description, ...options });
}

// Add convenience methods for common toast types
toast.success = (message: string, options = {}) => sonnerToast.success(message, options);
toast.error = (message: string, options = {}) => sonnerToast.error(message, options);
toast.info = (message: string, options = {}) => sonnerToast.info(message, options);
toast.warning = (message: string, options = {}) => sonnerToast.warning(message, options);

// This is the hook that will be used in components
function useToast() {
  return {
    toast,
    toasts: memoryState.toasts
  }
}

export { useToast, toast, Toaster }
