import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Plus, Check, X, User, Mail, Phone, Lock, Edit, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { employeeService, ROLE_PERMISSIONS } from '@/services/api/employeeService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/utils/formatters'
import type { User as EmployeeUser, Role } from '@/types'

const ROLES: Role[] = [
  'Super Admin',
  'Manager',
  'Inventory Manager',
  'Cashier',
  'Accountant',
  'Auditor',
]

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingEmp, setEditingEmp] = React.useState<EmployeeUser | null>(null)

  // Form Fields
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<Role>('Cashier')
  const [phone, setPhone] = React.useState('')
  const [status, setStatus] = React.useState<'active' | 'inactive' | 'suspended'>('active')

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const handleOpenCreate = () => {
    setEditingEmp(null)
    setName('')
    setEmail('')
    setRole('Cashier')
    setPhone('')
    setStatus('active')
    setModalOpen(true)
  }

  const handleOpenEdit = (emp: EmployeeUser) => {
    setEditingEmp(emp)
    setName(emp.name)
    setEmail(emp.email)
    setRole(emp.role)
    setPhone(emp.phone || '')
    setStatus(emp.status)
    setModalOpen(true)
  }

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmp) {
        await employeeService.updateEmployee(editingEmp.id, { name, role, phone, status })
        success('Staff Updated', `${name} updated`)
      } else {
        await employeeService.createEmployee({ name, email, role, phone, status })
        success('Staff Account Created', `${name} (${role})`)
      }
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setModalOpen(false)
    } catch (err: any) {
      error('Failed to Save Staff', err.message)
    }
  }

  const handleToggleStatus = async (emp: EmployeeUser) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active'
    try {
      await employeeService.toggleStatus(emp.id, newStatus)
      success('Status Changed', `${emp.name} is now ${newStatus}`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    } catch (err: any) {
      error('Status Update Failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees & Role-Based Permissions"
        description="Single-store staff access management, granular role privileges matrix, and account status controls"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Staff Member
          </Button>
        }
      />

      <Tabs defaultValue="staff">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="staff">Staff Directory ({employees?.length || 0})</TabsTrigger>
            <TabsTrigger value="matrix">Role Permission Matrix</TabsTrigger>
          </TabsList>
        </div>

        {/* STAFF DIRECTORY TAB */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-[#374151] text-[#64748B] border-b border-[#E2E8F0] dark:border-[#374151] uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-center">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#94A3B8]">
                        Loading employee roster...
                      </td>
                    </tr>
                  ) : (
                    employees?.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#374151]/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{emp.name}</span>
                          </div>
                          <div className="text-[11px] text-[#94A3B8] pl-9">{emp.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              emp.role === 'Super Admin'
                                ? 'primary'
                                : emp.role === 'Manager'
                                ? 'warning'
                                : emp.role === 'Cashier'
                                ? 'success'
                                : 'secondary'
                            }
                            size="sm"
                          >
                            {emp.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#9CA3AF]">
                          {emp.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {emp.lastLogin ? formatDate(emp.lastLogin, true) : 'Never logged in'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={emp.status === 'active' ? 'success' : 'danger'}
                            size="sm"
                          >
                            {emp.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(emp)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            {emp.role !== 'Super Admin' && (
                              <Button
                                size="sm"
                                variant={emp.status === 'active' ? 'danger' : 'success'}
                                onClick={() => handleToggleStatus(emp)}
                              >
                                {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ROLE PERMISSION MATRIX TAB */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Access Matrix</CardTitle>
              <p className="text-xs text-[#64748B]">
                Front-end UI enforcement reflects backend RBAC permission boundaries
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#374151] text-[#64748B] border-b border-[#E2E8F0] dark:border-[#374151] uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Permission Capability</th>
                      {ROLES.map((r) => (
                        <th key={r} className="py-3 px-3 text-center">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                    {[
                      { label: 'Access POS & Checkout', key: 'canAccessPos' },
                      { label: 'Manage Products & Pricing', key: 'canManageProducts' },
                      { label: 'Adjust Stock & Physical Audits', key: 'canManageInventory' },
                      { label: 'Create PO & Receive Goods', key: 'canManagePurchases' },
                      { label: 'Process Returns & Refunds', key: 'canProcessReturns' },
                      { label: 'Approve Sales Refunds', key: 'canApproveRefunds' },
                      { label: 'Void Completed Sales', key: 'canVoidSales' },
                      { label: 'Reconcile Cashier Shifts', key: 'canApproveShifts' },
                      { label: 'View Financial P&L Reports', key: 'canViewReports' },
                      { label: 'Manage Employees & Access', key: 'canManageEmployees' },
                      { label: 'Update Store Configuration', key: 'canManageSettings' },
                    ].map((row) => (
                      <tr key={row.key} className="hover:bg-[#F8FAFC] dark:hover:bg-[#374151]/40">
                        <td className="py-2.5 px-4 font-semibold text-[#1E293B] dark:text-[#F9FAFB]">
                          {row.label}
                        </td>
                        {ROLES.map((r) => {
                          const allowed = (ROLE_PERMISSIONS[r] as any)[row.key]
                          return (
                            <td key={r} className="py-2.5 px-3 text-center">
                              {allowed ? (
                                <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-slate-300 dark:text-[#334155] mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmp ? 'Edit Staff Account' : 'Register New Employee'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hassan Ali Mire"
          />

          {!editingEmp && (
            <Input
              label="Staff Email (Login ID)"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. hassan.cashier@supermarket.so"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Store Role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>

            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+252 61..."
            />
          </div>

          <Select
            label="Account Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="active">Active (Can Log In)</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#374151]">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Staff Member
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
