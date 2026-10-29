import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'secondary',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    primary:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80',
    secondary:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    danger:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
    info:
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80',
    purple:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
    outline:
      'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-transparent',
  }

  const dotColors = {
    primary: 'bg-indigo-500',
    secondary: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-cyan-500',
    purple: 'bg-purple-500',
    outline: 'bg-slate-400',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-semibold',
    md: 'text-xs px-2.5 py-0.5 rounded-full font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border leading-none tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
