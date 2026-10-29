import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1220]/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      {/* Dialog Window */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-2xl p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150',
          maxW[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#263449]">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#172338] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto py-4 flex-1">{children}</div>
      </div>
    </div>
  )
}
