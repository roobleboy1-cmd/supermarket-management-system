import * as React from 'react'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', disabled && 'opacity-50 pointer-events-none', className)}>
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'w-10 h-6 rounded-full transition-colors duration-200 ease-in-out',
            checked ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]' : 'bg-[#CBD5E1] dark:bg-[#263449]'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-200 ease-in-out',
            checked && 'transform translate-x-4'
          )}
        />
      </div>
      {(label || description) && (
        <div className="text-left">
          {label && <span className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] block">{label}</span>}
          {description && <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">{description}</span>}
        </div>
      )}
    </label>
  )
}
