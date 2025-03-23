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

// Extend the sonner toast type to include our variant
type ExtendedToastOptions = Parameters<typeof sonnerToast>[1] & {
  variant?: "default" | "destructive" | null
}

function toast(titleOrOptions: string | ToasterToast, options?: ExtendedToastOptions) {
  // If first argument is a string, treat it as a title
  if (typeof titleOrOptions === 'string') {
    return sonnerToast(titleOrOptions, options);
  }
  
  // Otherwise, use it as options object
  const { title, description, variant, ...restOptions } = titleOrOptions;
  
  // Forward to sonner with appropriate options
  if (variant === 'destructive') {
    return sonnerToast.error(title as string, { 
      description,
      ...restOptions 
    });
  }
  
  return sonnerToast(title as string, { 
    description,
    ...restOptions
  });
}

// This is the hook that will be used in components
function useToast() {
  return {
    // Export the sonner toast function for direct use
    toast,
    // Add convenience methods for common toast types
    success: (message: string, options = {}) => sonnerToast.success(message, options),
    error: (message: string, options = {}) => sonnerToast.error(message, options),
    info: (message: string, options = {}) => sonnerToast.info(message, options),
    warning: (message: string, options = {}) => sonnerToast.warning(message, options),
    // Keep track of toasts for legacy compatibility
    toasts: memoryState.toasts
  }
}

export { useToast, toast, Toaster }
