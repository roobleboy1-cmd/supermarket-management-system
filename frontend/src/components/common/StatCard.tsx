import * as React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
  gradient?: string
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25',
  gradient,
  className,
}) => {
  return (
    <Card
      className={cn(
        'relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border border-[#E2E8F0] dark:border-[#263449]',
        className
      )}
    >
      {/* Optional decorative ambient glow on hover */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110',
                iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-slate-50">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
                trend.isPositive
                  ? 'text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'text-rose-700 bg-rose-100/80 dark:bg-rose-950/70 dark:text-rose-300'
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8] font-medium line-clamp-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
