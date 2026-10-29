import * as React from 'react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: SelectOption[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const generatedId = React.useId()
    const selectId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-[#111827] dark:text-[#F9FAFB] mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] px-3.5 py-2 text-sm text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] transition disabled:opacity-50 cursor-pointer',
            error && 'border-[#EF4444] focus:ring-[#EF4444]',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1F2937] text-[#111827] dark:text-[#F9FAFB]">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
