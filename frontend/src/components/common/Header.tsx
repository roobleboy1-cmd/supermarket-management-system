import * as React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  Wifi,
  WifiOff,
  LogOut,
  ShoppingCart,
  Command,
  RefreshCw,
  Menu,
  ChevronDown,
  UserCheck,
  Shield,
  Check,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useOfflineStore } from '@/stores/offlineStore'
import { useToast } from '@/components/ui/Toast'
import { localStore } from '@/services/dataStore'
import { cn } from '@/utils/cn'
import type { Role } from '@/types'
import {
  ROLE_DESCRIPTIONS_SO,
  ROLE_DEFAULT_REDIRECT,
  isPathAllowedForRole,
} from '@/utils/permissions'

const AVAILABLE_ROLES: { role: Role; demoEmail: string }[] = [
  { role: 'Super Admin', demoEmail: 'admin@supermarket.so' },
  { role: 'Manager', demoEmail: 'fadumo.mgr@supermarket.so' },
  { role: 'Cashier', demoEmail: 'hassan.cashier@supermarket.so' },
  { role: 'Inventory Manager', demoEmail: 'khadija.inv@supermarket.so' },
  { role: 'Accountant', demoEmail: 'jama.acc@supermarket.so' },
  { role: 'Auditor', demoEmail: 'sahra.audit@supermarket.so' },
]

export const Header: React.FC<{
  onOpenCommandPalette: () => void
  onToggleMobileMenu: () => void
}> = ({ onOpenCommandPalette, onToggleMobileMenu }) => {
  const { user, logout, switchRoleUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { isOnline, queuedTransactions, isSyncing, syncTransactions } = useOfflineStore()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [profileOpen, setProfileOpen] = React.useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false)
  const [roleSwitcherOpen, setRoleSwitcherOpen] = React.useState(false)

  const unreadNotificationsCount = localStore.notifications.filter((n) => !n.read).length
  const currentShift = localStore.currentShift

  const currentRole: Role = user?.role || 'Super Admin'
  const currentRoleInfo = ROLE_DESCRIPTIONS_SO[currentRole]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSwitchRole = (targetRole: Role) => {
    const newUser = switchRoleUser(targetRole)
    setRoleSwitcherOpen(false)
    if (newUser) {
      success(
        `Doorka: ${targetRole}`,
        `${newUser.name} — Hadda waxa kuu muuqanaya kaliya shaqada ${targetRole}!`
      )

      // If the current path is not allowed for the new role, automatically navigate to their home
      if (!isPathAllowedForRole(targetRole, location.pathname)) {
        navigate(ROLE_DEFAULT_REDIRECT[targetRole] || '/')
      }
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger Toggle Button + Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 transition"
          title="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar & Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 sm:py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate hidden sm:inline">Search products, invoices, customers...</span>
            <span className="truncate sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            <Command className="h-3 w-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Role Switcher Pill (Shows who is working & lets manager switch test roles instantly) */}
        <div className="relative">
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition text-xs font-semibold"
            title="Eeg shaqada doorka kale / Switch Role"
          >
            <UserCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline truncate max-w-[120px]">
              {user?.name?.split(' ')[0] || 'User'}:
            </span>
            <span className="font-bold truncate max-w-[90px] sm:max-w-none">
              {currentRole}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {roleSwitcherOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in zoom-in-95 text-xs"
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Shaqooyinka Supermarket-ka (Roles)
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Dooro qofka aad doonaysid inaad shaqadiisa aragto:
                </p>
              </div>

              <div className="py-1 space-y-1">
                {AVAILABLE_ROLES.map(({ role }) => {
                  const isCurrent = currentRole === role
                  const info = ROLE_DESCRIPTIONS_SO[role]
                  const matchedUser = localStore.users.find((u) => u.role === role)

                  return (
                    <button
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      className={cn(
                        'w-full text-left p-2 rounded-xl transition flex items-start justify-between gap-2',
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {role}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1 rounded bg-blue-600 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                          {matchedUser?.name || 'Shaqaale'}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {info.job}
                        </p>
                      </div>

                      {isCurrent && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Offline / Online Sync Indicator */}
        <div className="flex items-center">
          {isOnline ? (
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="h-3 w-3 hidden sm:inline" />
              <span className="hidden sm:inline">Online</span>
              {queuedTransactions.length > 0 && (
                <button
                  onClick={() => syncTransactions()}
                  disabled={isSyncing}
                  className="ml-1 inline-flex items-center gap-1 font-bold underline hover:opacity-80"
                >
                  <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                  Sync ({queuedTransactions.length})
                </button>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span> ({queuedTransactions.length})
            </div>
          )}
        </div>

        {/* Current Cashier Shift Indicator (if permitted) */}
        {['Super Admin', 'Manager', 'Cashier', 'Accountant'].includes(currentRole) && (
          <Link
            to="/shifts"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Shift: {currentShift?.status === 'open' ? 'Active' : 'Closed'}</span>
          </Link>
        )}

        {/* Quick Launch POS Button (if permitted) */}
        {['Super Admin', 'Manager', 'Cashier'].includes(currentRole) && (
          <Link
            to="/pos"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Open POS</span>
          </Link>
        )}

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-600 text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
              {unreadNotificationsCount}
            </span>
          )}
        </Link>

        {/* Theme Toggle Dropdown */}
        <div className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Theme Selection"
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
          </button>
          {themeMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-lg z-50 text-xs animate-in zoom-in-95"
              onClick={() => setThemeMenuOpen(false)}
            >
              <button
                onClick={() => setTheme('light')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Moon className="h-3.5 w-3.5 text-blue-400" /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Laptop className="h-3.5 w-3.5 text-slate-400" /> System
              </button>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/50 transition cursor-pointer"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 shadow-2xl z-50 text-xs animate-in zoom-in-95"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@supermarket.so'}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', currentRoleInfo?.bgBadge)}>
                    {currentRole}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {currentRoleInfo?.job}
                </p>
              </div>

              {currentRole === 'Super Admin' && (
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Store Settings
                </Link>
              )}

              <Link
                to="/activity-logs"
                className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Activity Logs
              </Link>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
