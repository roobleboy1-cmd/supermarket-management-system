import * as React from 'react'
import { cn } from '@/utils/cn'

interface TabsContextType {
  activeTab: string
  setActiveTab: (val: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export const Tabs: React.FC<{
  defaultValue: string
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
  className?: string
}> = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const activeTab = value !== undefined ? value : internalValue

  const setActiveTab = (val: string) => {
    setInternalValue(val)
    if (onValueChange) onValueChange(val)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-start rounded-xl bg-[#F8FAFC] dark:bg-[#172338] border border-[#E2E8F0] dark:border-[#263449] p-1 text-[#64748B] dark:text-[#94A3B8] gap-1 overflow-x-auto max-w-full',
        className
      )}
      {...props}
    />
  )
}

export const TabsTrigger: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
}> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.activeTab === value

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none cursor-pointer',
        isActive
          ? 'bg-white dark:bg-[#111C31] text-[#3B82F6] dark:text-[#F8FAFC] shadow-xs border border-[#E2E8F0]/80 dark:border-[#263449]'
          : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#E2E8F0]/50 dark:hover:bg-[#14213D]',
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<{
  value: string
  children: React.ReactNode
  className?: string
}> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div className={cn('mt-4 animate-in fade-in duration-150 focus:outline-none', className)}>
      {children}
    </div>
  )
}
