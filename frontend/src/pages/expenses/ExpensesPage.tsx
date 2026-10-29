import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Wallet, Plus, Trash2, Calendar, DollarSign, Filter } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { expenseService } from '@/services/api/expenseService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'

const CATEGORIES: ExpenseCategory[] = [
  'Electricity & Water',
  'Packaging & Supplies',
  'Staff Salaries',
  'Rent',
  'Equipment & Maintenance',
  'Security',
  'Taxes & Licenses',
  'Other Operating Expense',
]

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()

  const [filterCategory, setFilterCategory] = React.useState('all')
  const [modalOpen, setModalOpen] = React.useState(searchParams.get('action') === 'new')

  // Form State
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState<ExpenseCategory>('Electricity & Water')
  const [amount, setAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('Cash')
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [paidTo, setPaidTo] = React.useState('')
  const [receiptReference, setReceiptReference] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filterCategory],
    queryFn: () => expenseService.getExpenses(filterCategory),
  })

  const totalRecorded = React.useMemo(() => {
    return (expenses || []).reduce((acc, e) => acc + e.amount, 0)
  }, [expenses])

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount) || 0
    if (amt <= 0) {
      error('Invalid Amount', 'Expense amount must be greater than zero')
      return
    }

    try {
      await expenseService.createExpense({
        title,
        category,
        amount: amt,
        paymentMethod,
        expenseDate,
        paidTo,
        receiptReference,
        notes,
        recordedBy: user?.name || 'Store Accountant',
      })
      success('Expense Recorded', `$${amt.toFixed(2)} for ${title}`)
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setModalOpen(false)
      setTitle('')
      setAmount('')
      setPaidTo('')
      setReceiptReference('')
      setNotes('')
    } catch (err: any) {
      error('Failed to Record Expense', err.message)
    }
  }

  const handleDeleteExpense = async (exp: Expense) => {
    if (confirm(`Delete expense "${exp.title}" ($${exp.amount.toFixed(2)})?`)) {
      try {
        await expenseService.deleteExpense(exp.id)
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        success('Expense Deleted', exp.title)
      } catch (err: any) {
        error('Delete Failed', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Operating Expenses"
        description="Recorded operating expenditures, utility bills, packaging supplies, and operating cost summaries"
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Record Operating Expense
          </Button>
        }
      />

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Recorded Expenses"
          value={formatCurrency(totalRecorded)}
          description={`${expenses?.length || 0} recorded expenditures`}
          icon={Wallet}
          iconColor="text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400"
        />
        <StatCard
          title="Top Category"
          value="Electricity & Fuel"
          description="Backup generators & cold storage"
          icon={DollarSign}
          iconColor="text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400"
        />
        <StatCard
          title="Net Operating Impact"
          value="Tracked in P&L"
          description="Deducted from store gross profit"
          icon={Calendar}
          iconColor="text-[#16A34A] bg-blue-100 dark:bg-blue-950 dark:text-[#84CC16]"
        />
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Operating Expenses Journal</CardTitle>
          <div className="w-56">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#374151]"
            >
              <option value="all">All Expense Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#374151] text-[#64748B] border-b border-[#E2E8F0] dark:border-[#374151] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Expense Ref</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      No operating expenses registered for this selection.
                    </td>
                  </tr>
                ) : (
                  expenses?.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#374151]">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {exp.expenseNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111827] dark:text-[#F9FAFB]">
                          {exp.title}
                        </div>
                        {exp.receiptReference && (
                          <div className="text-[10px] text-[#94A3B8] font-mono">
                            Ref: {exp.receiptReference}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" size="sm">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{formatDate(exp.expenseDate)}</td>
                      <td className="py-3 px-4 font-medium text-[#1E293B] dark:text-[#F9FAFB]">
                        {exp.paidTo}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {formatCurrency(exp.amount)} ({exp.paymentMethod})
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1 rounded text-[#94A3B8] hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* RECORD EXPENSE MODAL */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Operating Expense"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Auxiliary generator diesel fuel delivery"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Expense Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="180.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="Cash">Cash Drawer</option>
              <option value="EVC Plus">EVC Plus</option>
              <option value="eDahab">eDahab</option>
              <option value="ZAAD">ZAAD</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </Select>

            <Input
              label="Date Incurred"
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <Input
            label="Paid To / Vendor Name"
            required
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
            placeholder="e.g. Hass Petroleum Mogadishu"
          />

          <Input
            label="Receipt / Voucher Reference No"
            value={receiptReference}
            onChange={(e) => setReceiptReference(e.target.value)}
            placeholder="e.g. HASS-REC-8741"
          />

          <Input
            label="Notes / Justification"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 150 Litres backup power for central freezer room"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#374151]">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Post Expense
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
