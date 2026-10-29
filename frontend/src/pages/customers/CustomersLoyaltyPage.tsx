import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Award, Phone, Mail, MapPin, Search, Edit, Trash2, History } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { customerService } from '@/services/api/customerService'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Customer, CustomerTier, LoyaltyTransaction } from '@/types'

export const CustomersLoyaltyPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null)
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = React.useState<Customer | null>(null)

  // Form Fields
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerService.getCustomers(search),
  })

  const { data: loyaltyHistory } = useQuery({
    queryKey: ['loyalty-history', selectedCustomerForHistory?.id],
    queryFn: () =>
      selectedCustomerForHistory
        ? customerService.getLoyaltyHistory(selectedCustomerForHistory.id)
        : Promise.resolve([]),
    enabled: !!selectedCustomerForHistory,
  })

  const handleOpenCreate = () => {
    setEditingCustomer(null)
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setModalOpen(true)
  }

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c)
    setName(c.name)
    setPhone(c.phone)
    setEmail(c.email || '')
    setAddress(c.address || '')
    setModalOpen(true)
  }

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, { name, phone, email, address })
        success('Customer Updated', name)
      } else {
        await customerService.createCustomer({ name, phone, email, address })
        success('Customer Registered', name)
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setModalOpen(false)
    } catch (err: any) {
      error('Failed to save customer', err.message)
    }
  }

  const handleDelete = async (c: Customer) => {
    if (confirm(`Remove customer "${c.name}"?`)) {
      try {
        await customerService.deleteCustomer(c.id)
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        success('Customer Deleted', c.name)
      } catch (err: any) {
        error('Error', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Loyalty Club"
        description="Customer directory, loyalty points balance, reward redemption history, and tier benefits"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Register Customer
          </Button>
        }
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search customers by name, phone (+252), or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full py-12 text-center text-xs text-[#94A3B8]">Loading customers...</p>
        ) : (
          (customers || []).map((c) => (
            <Card key={c.id} className="hover:border-blue-500 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {c.name}
                    </CardTitle>
                    <p className="text-xs text-[#64748B] mt-0.5">{c.phone}</p>
                  </div>
                  <Badge
                    variant={
                      c.tier === 'Platinum'
                        ? 'primary'
                        : c.tier === 'Gold'
                        ? 'warning'
                        : c.tier === 'Silver'
                        ? 'secondary'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {c.tier} Tier
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#F5F7FC] dark:bg-[#172338]/40 text-center">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">Points Balance</span>
                    <span className="font-bold text-sm text-[#3B82F6] dark:text-[#06B6D4]">
                      {c.loyaltyPoints} pts
                    </span>
                    <span className="text-[9px] text-[#94A3B8] block">
                      ≈ ${(c.loyaltyPoints * 0.01).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">Total Store Spent</span>
                    <span className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatCurrency(c.totalSpent)}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] block">{c.totalVisits} checkouts</span>
                  </div>
                </div>

                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCustomerForHistory(c)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5" />
                    Points Ledger
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#3B82F6]"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1 rounded text-[#94A3B8] hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CUSTOMER MODAL */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Register Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amina Cali Maxamed"
          />
          <Input
            label="Mobile Phone (USSD & SMS receipt)"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+252 61..."
          />
          <Input
            label="Email Address (Optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. amina@gmail.com"
          />
          <Input
            label="District / Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Waberi District, Mogadishu"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* LOYALTY HISTORY MODAL */}
      <Dialog
        open={!!selectedCustomerForHistory}
        onClose={() => setSelectedCustomerForHistory(null)}
        title={`Loyalty Points Ledger: ${selectedCustomerForHistory?.name}`}
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-900 dark:text-blue-300">Available Points:</span>
            <span className="font-bold text-base text-[#3B82F6] dark:text-[#06B6D4]">
              {selectedCustomerForHistory?.loyaltyPoints} Points
            </span>
          </div>

          <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] text-xs">
            {loyaltyHistory?.map((lt) => (
              <div key={lt.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{lt.description}</p>
                  <p className="text-[11px] text-[#94A3B8]">{formatDate(lt.createdAt, true)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold ${
                      lt.type === 'earned' ? 'text-emerald-600' : 'text-[#3B82F6]'
                    }`}
                  >
                    {lt.type === 'earned' ? `+${lt.points}` : `-${lt.points}`} pts
                  </span>
                  <span className="text-[10px] text-[#94A3B8] block">Bal: {lt.balanceAfter}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSelectedCustomerForHistory(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
