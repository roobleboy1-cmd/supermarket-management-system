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

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const COMMAND_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, category: 'Pages' },
  { name: 'Point of Sale (POS)', path: '/pos', icon: ShoppingCart, category: 'Pages' },
  { name: 'Products Catalog', path: '/products', icon: Package, category: 'Pages' },
  { name: 'Categories & Brands', path: '/categories', icon: Layers, category: 'Pages' },
  { name: 'Store Inventory', path: '/inventory', icon: Boxes, category: 'Pages' },
  { name: 'Batches & Expiry Dates', path: '/batches', icon: CalendarClock, category: 'Pages' },
  { name: 'Stock Counts & Adjustments', path: '/stock-counts', icon: ClipboardCheck, category: 'Pages' },
  { name: 'Suppliers Directory', path: '/suppliers', icon: Truck, category: 'Pages' },
  { name: 'Purchase Orders', path: '/purchases', icon: FileSpreadsheet, category: 'Pages' },
  { name: 'Sales & Transactions', path: '/sales', icon: Receipt, category: 'Pages' },
  { name: 'Returns & Refunds', path: '/returns', icon: RotateCcw, category: 'Pages' },
  { name: 'Customers & Loyalty', path: '/customers', icon: Users, category: 'Pages' },
  { name: 'Cashier Shifts', path: '/shifts', icon: Clock, category: 'Pages' },
  { name: 'Store Expenses', path: '/expenses', icon: Wallet, category: 'Pages' },
  { name: 'Employees & Permissions', path: '/employees', icon: ShieldCheck, category: 'Pages' },
  { name: 'Promotions & Coupons', path: '/promotions', icon: Tag, category: 'Pages' },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, category: 'Pages' },
  { name: 'Notifications', path: '/notifications', icon: Bell, category: 'Pages' },
  { name: 'Activity Logs', path: '/activity-logs', icon: History, category: 'Pages' },
  { name: 'Store Settings', path: '/settings', icon: Settings, category: 'Pages' },
  { name: 'Add New Product', path: '/products?action=new', icon: PlusCircle, category: 'Actions' },
  { name: 'Record Operating Expense', path: '/expenses?action=new', icon: PlusCircle, category: 'Actions' },
  { name: 'New Purchase Order', path: '/purchases?action=new', icon: PlusCircle, category: 'Actions' },
]

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = React.useState('')
  const navigate = useNavigate()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose() // toggle
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!open) return null

  const filtered = COMMAND_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      {/* Search box */}
      <div className="relative w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">No matching pages or actions found.</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => handleSelect(item.path)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
