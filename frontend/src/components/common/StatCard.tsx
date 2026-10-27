import * as React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  icon?: React.ElementType
  iconColor?: string
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
  className,
}) => {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {Icon && (
            <div className={cn('p-2.5 rounded-xl flex items-center justify-center shrink-0', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-400'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </CardContent>
    </Card>
  )
}
