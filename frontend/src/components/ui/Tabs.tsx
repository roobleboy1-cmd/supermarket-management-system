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
        'inline-flex h-10 items-center justify-start rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 gap-1 overflow-x-auto max-w-full',
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
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all focus:outline-none cursor-pointer',
        isActive
          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
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

  return <div className={cn('mt-4 focus:outline-none animate-in fade-in-50 duration-150', className)}>{children}</div>
}
