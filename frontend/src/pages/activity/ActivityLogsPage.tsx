import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, Search, Shield, Filter, User } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { notificationService } from '@/services/api/notificationService'
import { formatDate } from '@/utils/formatters'

export const ActivityLogsPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = React.useState('all')
  const [selectedRole, setSelectedRole] = React.useState('all')
  const [selectedActor, setSelectedActor] = React.useState('all')
  const [search, setSearch] = React.useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedModule],
    queryFn: () => notificationService.getAuditLogs(selectedModule),
  })

  const uniqueActors = React.useMemo(() => {
    if (!logs) return []
    const set = new Set<string>()
    logs.forEach((l) => set.add(l.actorName))
    return Array.from(set)
  }, [logs])

  const filtered = React.useMemo(() => {
    if (!logs) return []
    return logs.filter((l) => {
      // Role filter
      if (selectedRole !== 'all' && l.role !== selectedRole) return false
      // Actor filter
      if (selectedActor !== 'all' && l.actorName !== selectedActor) return false
      // Search term
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        l.actorName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      )
    })
  }, [logs, search, selectedRole, selectedActor])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & Staff Activity Logs"
        description="Immutable single-store operational journal tracking user actors, security events, timestamps, and data changes"
      />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi staff, action, or record..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="all">Dhammaan Shaqaalaha (All Users)</option>
                {uniqueActors.map((actor) => (
                  <option key={actor} value={actor}>
                    User: {actor}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="all">Dhammaan Doorarka (All Roles)</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
            <div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="all">Dhammaan Qaybaha (All Modules)</option>
                <option value="POS">Point of Sale (POS)</option>
                <option value="Products">Products Catalog</option>
                <option value="Inventory">Inventory Adjustments</option>
                <option value="Purchases">Purchase Orders</option>
                <option value="Returns">Returns & Refunds</option>
                <option value="Cashier Shifts">Cashier Shifts</option>
                <option value="Expenses">Expenses</option>
                <option value="Store Settings">Store Settings</option>
                <option value="Auth">Authentication</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Staff Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Details & Target Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit trail logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No activity logs recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp, true)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {log.actorName}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" size="sm">
                        {log.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {log.module}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
