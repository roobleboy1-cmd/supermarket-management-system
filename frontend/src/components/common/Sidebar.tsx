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
  X,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'
import type { Role } from '@/types'
import { ROLE_DESCRIPTIONS_SO } from '@/utils/permissions'

interface NavSection {
  title: string
  items: {
    name: string
    path: string
    icon: React.ElementType
    permission?: string
    badge?: string
    roles?: Role[]
  }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant', 'Auditor'],
      },
      {
        name: 'Point of Sale (POS)',
        path: '/pos',
        icon: ShoppingCart,
        roles: ['Super Admin', 'Manager', 'Cashier'],
      },
      {
        name: 'Sales & Transactions',
        path: '/sales',
        icon: Receipt,
        roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant', 'Auditor'],
      },
      {
        name: 'Returns & Refunds',
        path: '/returns',
        icon: RotateCcw,
        roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant'],
      },
      {
        name: 'Cashier Shifts',
        path: '/shifts',
        icon: Clock,
        roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant'],
      },
    ],
  },
  {
    title: 'Catalog & Inventory',
    items: [
      {
        name: 'Products',
        path: '/products',
        icon: Package,
        roles: ['Super Admin', 'Manager', 'Inventory Manager'],
      },
      {
        name: 'Categories & Brands',
        path: '/categories',
        icon: Layers,
        roles: ['Super Admin', 'Manager', 'Inventory Manager'],
      },
      {
        name: 'Store Inventory',
        path: '/inventory',
        icon: Boxes,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
      },
      {
        name: 'Batches & Expiry',
        path: '/batches',
        icon: CalendarClock,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
      },
      {
        name: 'Stock Adjustments',
        path: '/stock-counts',
        icon: ClipboardCheck,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
      },
    ],
  },
  {
    title: 'Purchasing & CRM',
    items: [
      {
        name: 'Suppliers',
        path: '/suppliers',
        icon: Truck,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant'],
      },
      {
        name: 'Purchase Orders',
        path: '/purchases',
        icon: FileSpreadsheet,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant'],
      },
      {
        name: 'Customers & Loyalty',
        path: '/customers',
        icon: Users,
        roles: ['Super Admin', 'Manager', 'Cashier'],
      },
      {
        name: 'Promotions & Coupons',
        path: '/promotions',
        icon: Tag,
        roles: ['Super Admin', 'Manager'],
      },
    ],
  },
  {
    title: 'Finance & Administration',
    items: [
      {
        name: 'Expenses',
        path: '/expenses',
        icon: Wallet,
        roles: ['Super Admin', 'Manager', 'Accountant'],
      },
      {
        name: 'Reports & Analytics',
        path: '/reports',
        icon: BarChart3,
        roles: ['Super Admin', 'Manager', 'Accountant', 'Auditor'],
      },
      {
        name: 'Employees & Access',
        path: '/employees',
        icon: ShieldCheck,
        roles: ['Super Admin'],
      },
      {
        name: 'Notifications',
        path: '/notifications',
        icon: Bell,
        roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Cashier', 'Accountant', 'Auditor'],
      },
      {
        name: 'Activity Logs',
        path: '/activity-logs',
        icon: History,
        roles: ['Super Admin', 'Manager', 'Auditor'],
      },
      {
        name: 'Store Settings',
        path: '/settings',
        icon: Settings,
        roles: ['Super Admin'],
      },
    ],
  },
]

export const Sidebar: React.FC<{
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}> = ({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const { user } = useAuthStore()
  const location = useLocation()

  // Close mobile drawer when route changes
  React.useEffect(() => {
    onCloseMobile()
  }, [location.pathname])

  const currentRole: Role = user?.role || 'Super Admin'
  const roleDesc = ROLE_DESCRIPTIONS_SO[currentRole]

  const renderNavList = (isMobileView: boolean = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {/* Role notice banner if restricted role */}
      {currentRole !== 'Super Admin' && (!collapsed || isMobileView) && (
        <div className="px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Shaqadaada: {roleDesc?.title}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
            Waxaa laguu soo saaray kaliya qaybaha aad awoodda u leedahay.
          </p>
        </div>
      )}

      {NAV_SECTIONS.map((section) => {
        // Filter items based on current user role
        const visibleItems = section.items.filter(
          (item) => !item.roles || item.roles.includes(currentRole)
        )

        // Don't render empty sections
        if (visibleItems.length === 0) return null

        return (
          <div key={section.title} className="space-y-1">
            {(!collapsed || isMobileView) && (
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {section.title}
              </h4>
            )}
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed && !isMobileView ? item.name : undefined}
                  onClick={() => {
                    if (isMobileView) onCloseMobile()
                  }}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400',
                    collapsed && !isMobileView && 'justify-center px-2'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    )}
                  />
                  {(!collapsed || isMobileView) && <span className="truncate flex-1">{item.name}</span>}
                </NavLink>
              )
            })}
          </div>
        )
      })}
    </div>
  )

  const renderUserFooter = (isMobileView: boolean = false) => (
    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className={cn('flex items-center gap-2.5', collapsed && !isMobileView && 'justify-center')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
        </div>
        {(!collapsed || isMobileView) && (
          <div className="flex flex-col truncate flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'Administrator'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.2 rounded border truncate',
                  roleDesc?.bgBadge || 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {currentRole}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on md and larger) */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 z-30 select-none shrink-0 h-screen sticky top-0',
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
                  Single Store Central
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {renderNavList(false)}
        {renderUserFooter(false)}
      </aside>

      {/* MOBILE RESPONSIVE DRAWER (Visible when mobileOpen is true on small screens) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    SomSupermarket
                  </span>
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    Single Store Central
                  </span>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderNavList(true)}
            {renderUserFooter(true)}
          </div>
        </div>
      )}
    </>
  )
}
