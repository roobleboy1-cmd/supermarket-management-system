import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer'

    const variants = {
      primary:
        'bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white focus:ring-[#3B82F6] shadow-sm shadow-blue-500/25 active:scale-[0.98]',
      secondary:
        'bg-[#F8FAFC] dark:bg-[#172338] hover:bg-[#E2E8F0] dark:hover:bg-[#20304c] text-[#0F172A] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#263449] focus:ring-slate-400 active:scale-[0.98]',
      outline:
        'border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] hover:bg-[#F8FAFC] dark:hover:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] focus:ring-[#3B82F6] active:scale-[0.98] shadow-2xs',
      danger:
        'bg-gradient-to-r from-[#EF4444] to-[#F43F5E] hover:from-[#DC2626] hover:to-[#E11D48] text-white focus:ring-[#EF4444] shadow-sm shadow-red-500/20 active:scale-[0.98]',
      ghost:
        'hover:bg-[#F8FAFC] dark:hover:bg-[#172338] text-[#0F172A] dark:text-[#F8FAFC] focus:ring-[#3B82F6] active:scale-[0.98]',
      success:
        'bg-gradient-to-r from-[#10B981] to-[#06B6D4] hover:from-[#059669] hover:to-[#0891B2] text-white focus:ring-[#10B981] shadow-sm shadow-emerald-500/25 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-10 gap-2',
      lg: 'text-base px-6 py-2.5 h-12 gap-2.5',
      icon: 'h-9 w-9 p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
