import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
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
  PlusCircle,
} from 'lucide-react'
import type { Role } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface CommandItem {
  name: string
  path: string
  icon: React.ElementType
  category: 'Pages' | 'Actions'
  roles?: Role[]
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant', 'Auditor'],
  },
  {
    name: 'Point of Sale (POS)',
    path: '/pos',
    icon: ShoppingCart,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Cashier'],
  },
  {
    name: 'Products Catalog',
    path: '/products',
    icon: Package,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager'],
  },
  {
    name: 'Categories & Brands',
    path: '/categories',
    icon: Layers,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager'],
  },
  {
    name: 'Store Inventory',
    path: '/inventory',
    icon: Boxes,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
  },
  {
    name: 'Batches & Expiry Dates',
    path: '/batches',
    icon: CalendarClock,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
  },
  {
    name: 'Stock Counts & Adjustments',
    path: '/stock-counts',
    icon: ClipboardCheck,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Auditor'],
  },
  {
    name: 'Suppliers Directory',
    path: '/suppliers',
    icon: Truck,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant'],
  },
  {
    name: 'Purchase Orders',
    path: '/purchases',
    icon: FileSpreadsheet,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant'],
  },
  {
    name: 'Sales & Transactions',
    path: '/sales',
    icon: Receipt,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant', 'Auditor'],
  },
  {
    name: 'Returns & Refunds',
    path: '/returns',
    icon: RotateCcw,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant'],
  },
  {
    name: 'Customers & Loyalty',
    path: '/customers',
    icon: Users,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Cashier'],
  },
  {
    name: 'Cashier Shifts',
    path: '/shifts',
    icon: Clock,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Cashier', 'Accountant'],
  },
  {
    name: 'Store Expenses',
    path: '/expenses',
    icon: Wallet,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Accountant'],
  },
  {
    name: 'Employees & Permissions',
    path: '/employees',
    icon: ShieldCheck,
    category: 'Pages',
    roles: ['Super Admin'],
  },
  {
    name: 'Promotions & Coupons',
    path: '/promotions',
    icon: Tag,
    category: 'Pages',
    roles: ['Super Admin', 'Manager'],
  },
  {
    name: 'Reports & Analytics',
    path: '/reports',
    icon: BarChart3,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Accountant', 'Auditor'],
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: Bell,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Cashier', 'Accountant', 'Auditor'],
  },
  {
    name: 'Activity Logs',
    path: '/activity-logs',
    icon: History,
    category: 'Pages',
    roles: ['Super Admin', 'Manager', 'Auditor'],
  },
  {
    name: 'Store Settings',
    path: '/settings',
    icon: Settings,
    category: 'Pages',
    roles: ['Super Admin'],
  },
  {
    name: 'Add New Product',
    path: '/products?action=new',
    icon: PlusCircle,
    category: 'Actions',
    roles: ['Super Admin', 'Manager', 'Inventory Manager'],
  },
  {
    name: 'Record Operating Expense',
    path: '/expenses?action=new',
    icon: PlusCircle,
    category: 'Actions',
    roles: ['Super Admin', 'Manager', 'Accountant'],
  },
  {
    name: 'New Purchase Order',
    path: '/purchases?action=new',
    icon: PlusCircle,
    category: 'Actions',
    roles: ['Super Admin', 'Manager', 'Inventory Manager', 'Accountant'],
  },
]

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = React.useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { language } = useLanguageStore()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const currentRole: Role = user?.role || 'Super Admin'

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    // Role check
    if (item.roles && !item.roles.includes(currentRole)) return false
    // Search query check
    if (!query) return true
    return item.name.toLowerCase().includes(query.toLowerCase())
  })

  const pages = filteredItems.filter((i) => i.category === 'Pages')
  const actions = filteredItems.filter((i) => i.category === 'Actions')

  const handleSelect = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1220]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111C31] shadow-2xl border border-[#E2E8F0] dark:border-[#263449] overflow-hidden animate-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-[#E2E8F0] dark:border-[#263449]">
          <Search className="h-4 w-4 text-[#94A3B8] shrink-0 mr-2" />
          <input
            type="text"
            placeholder={language === 'so' ? 'Raadi shaqo, bog ama ficil...' : 'Search page, task, or action...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-3.5 text-sm bg-transparent border-0 focus:outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8]"
          />
          <kbd className="hidden sm:inline-block rounded-md bg-[#F1F5F9] dark:bg-[#172338] px-2 py-0.5 text-[10px] font-mono text-[#64748B] font-bold">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              {language === 'so'
                ? `Wax natiijo ah lama helin "${query}" doorkaaga ${currentRole}.`
                : `No results found for "${query}" matching role ${currentRole}.`}
            </div>
          ) : (
            <>
              {actions.length > 0 && (
                <div>
                  <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                    {language === 'so' ? 'Ficillo Degdeg Ah (Actions)' : 'Quick Actions'}
                  </h4>
                  <div className="space-y-0.5">
                    {actions.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleSelect(item.path)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] dark:text-[#94A3B8] hover:bg-indigo-50 dark:hover:bg-[#172338] hover:text-indigo-600 dark:hover:text-indigo-400 transition text-left cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span>{item.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {pages.length > 0 && (
                <div>
                  <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                    {language === 'so'
                      ? `Boggaga Laguu Oggol Yahay (${currentRole})`
                      : `Permitted Pages (${currentRole})`}
                  </h4>
                  <div className="space-y-0.5">
                    {pages.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleSelect(item.path)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#172338] transition text-left cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-[#94A3B8] shrink-0" />
                          <span>{item.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
