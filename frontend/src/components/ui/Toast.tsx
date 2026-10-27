import * as React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: ToastMessage[]
  toast: (message: Omit<ToastMessage, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (message: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: ToastMessage = { ...message, id }
      setToasts((prev) => [...prev, newToast])

      const duration = message.duration || 4500
      setTimeout(() => {
        dismiss(id)
      }, duration)
    },
    [dismiss]
  )

  const success = React.useCallback((title: string, description?: string) => toast({ title, description, type: 'success' }), [toast])
  const error = React.useCallback((title: string, description?: string) => toast({ title, description, type: 'error' }), [toast])
  const info = React.useCallback((title: string, description?: string) => toast({ title, description, type: 'info' }), [toast])
  const warning = React.useCallback((title: string, description?: string) => toast({ title, description, type: 'warning' }), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200',
              t.type === 'success' && 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-emerald-950 dark:text-emerald-100',
              t.type === 'error' && 'bg-white/95 dark:bg-slate-900/95 border-red-500/40 text-red-950 dark:text-red-100',
              t.type === 'warning' && 'bg-white/95 dark:bg-slate-900/95 border-amber-500/40 text-amber-950 dark:text-amber-100',
              t.type === 'info' && 'bg-white/95 dark:bg-slate-900/95 border-blue-500/40 text-blue-950 dark:text-blue-100'
            )}
          >
            <div className="shrink-0 pt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              {t.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{t.title}</h4>
              {t.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
