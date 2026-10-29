import * as React from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="opacity-40">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
