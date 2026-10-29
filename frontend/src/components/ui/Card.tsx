import * as React from 'react'
import { cn } from '@/utils/cn'

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-[#4B5563]',
        className
      )}
      {...props}
    />
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return <div className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props} />
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => {
  return (
    <h3
      className={cn(
        'text-base font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight leading-tight',
        className
      )}
      {...props}
    />
  )
}

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => {
  return <p className={cn('text-xs text-[#64748B] dark:text-[#9CA3AF] font-medium', className)} {...props} />
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return <div className={cn('flex items-center p-5 pt-0 border-t border-[#E2E8F0] dark:border-[#374151]', className)} {...props} />
}
