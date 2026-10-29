import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/common/Sidebar'
import { Header } from '@/components/common/Header'
import { CommandPalette } from '@/components/common/CommandPalette'
import { RoleGuard } from '@/components/common/RoleGuard'
import { useOfflineStore } from '@/stores/offlineStore'

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { init: initOffline } = useOfflineStore()

  React.useEffect(() => {
    initOffline()
  }, [initOffline])

  return (
    <div className="min-h-screen bg-[#F5F7FC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] flex transition-colors selection:bg-[#3B82F6] selection:text-white">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <RoleGuard>
            <Outlet />
          </RoleGuard>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}
