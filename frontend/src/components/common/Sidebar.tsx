import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  Truck,
  FileSpreadsheet,
  Receipt,
  RotateCcw,
  Users,
  Clock,
  Wallet,
  ShieldCheck,
  Tag,
  BarChart3,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'

interface NavSection {
  title: string
  items: {
    name: string
    path: string
    icon: React.ElementType
    permission?: string
    badge?: string
  }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Point of Sale (POS)', path: '/pos', icon: ShoppingCart },
      { name: 'Sales & Transactions', path: '/sales', icon: Receipt },
      { name: 'Returns & Refunds', path: '/returns', icon: RotateCcw },
      { name: 'Cashier Shifts', path: '/shifts', icon: Clock },
    ],
  },
  {
    title: 'Catalog & Inventory',
    items: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Categories & Brands', path: '/categories', icon: Layers },
      { name: 'Store Inventory', path: '/inventory', icon: Boxes },
      { name: 'Batches & Expiry', path: '/batches', icon: CalendarClock },
      { name: 'Stock Adjustments', path: '/stock-counts', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Purchasing & CRM',
    items: [
      { name: 'Suppliers', path: '/suppliers', icon: Truck },
      { name: 'Purchase Orders', path: '/purchases', icon: FileSpreadsheet },
      { name: 'Customers & Loyalty', path: '/customers', icon: Users },
      { name: 'Promotions & Coupons', path: '/promotions', icon: Tag },
    ],
  },
  {
    title: 'Finance & Administration',
    items: [
      { name: 'Expenses', path: '/expenses', icon: Wallet },
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { name: 'Employees & Access', path: '/employees', icon: ShieldCheck },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Activity Logs', path: '/activity-logs', icon: History },
      { name: 'Store Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const Sidebar: React.FC<{
  collapsed: boolean
  onToggleCollapse: () => void
}> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 z-30 select-none shrink-0 h-screen sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Store className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                SomSupermarket
              </span>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate">
                Central Single Store
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden md:flex"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    )}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.role || 'Super Admin'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
