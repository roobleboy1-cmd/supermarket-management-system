import * as React from 'react'
import { cn } from '@/utils/cn'

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#E2E8F0] dark:bg-[#172338]', className)}
      {...props}
    />
  )
}
