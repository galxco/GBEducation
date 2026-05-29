import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react'

// =============================================================
//  Tipos
// =============================================================

export type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (type: ToastType, message: string) => void
  dismiss: (id: string) => void
}

// =============================================================
//  Context
// =============================================================

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 3000)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
