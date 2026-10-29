import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64748B] dark:text-[#94A3B8]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#172338] px-3.5 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-[#111C31]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#EF4444] focus:ring-[#EF4444]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#64748B] dark:text-[#94A3B8]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'
