import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Package,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { salesService } from '@/services/api/salesService'
import { productService } from '@/services/api/productService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { SalesReturn, ReturnReason, PaymentMethod, ReturnItem } from '@/types'

const RETURN_REASONS: ReturnReason[] = [
  'Customer Regret',
  'Defective / Damaged',
  'Expired Product',
  'Wrong Product Purchased',
  'Incorrect Price Charged',
  'Other',
]

export const ReturnsRefundsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { success, error, warning } = useToast()

  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [originalInvoice, setOriginalInvoice] = React.useState('')
  const [refundMethod, setRefundMethod] = React.useState<PaymentMethod>('Cash')
  const [returnNotes, setReturnNotes] = React.useState('')

  // Item return line
  const [selectedProductId, setSelectedProductId] = React.useState('')
  const [returnQty, setReturnQty] = React.useState('1')
  const [refundPrice, setRefundPrice] = React.useState('1.60')
  const [selectedReason, setSelectedReason] = React.useState<ReturnReason>('Customer Regret')
  const [returnToInventory, setReturnToInventory] = React.useState(true)

  // Items to return
  const [returnItems, setReturnItems] = React.useState<ReturnItem[]>([])

  const { data: returns, isLoading } = useQuery({
    queryKey: ['sales-returns'],
    queryFn: () => salesService.getReturns(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-for-returns'],
    queryFn: () => productService.getProducts({ pageSize: 100 }),
  })

  // Add line to return basket
  const handleAddReturnLine = () => {
    if (!selectedProductId) return
    const prod = productsData?.items.find((p) => p.id === selectedProductId)
    if (!prod) return

    const qty = parseInt(returnQty, 10) || 1
    const price = parseFloat(refundPrice) || prod.sellingPrice

    setReturnItems([
      ...returnItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: price,
        refundAmount: qty * price,
        reason: selectedReason,
        returnToInventory,
      },
    ])
    setSelectedProductId('')
    setReturnQty('1')
  }

  // Submit Return Request
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalInvoice.trim()) {
      error('Invoice Required', 'Please enter original sales invoice number')
      return
    }
    if (returnItems.length === 0) {
      error('No Items', 'Add at least one return item')
      return
    }

    try {
      await salesService.createReturn({
        originalInvoiceNumber: originalInvoice.trim(),
        saleId: `sale-${Date.now()}`,
        items: returnItems,
        refundMethod,
        notes: returnNotes,
        inspectedBy: user?.name || 'Cashier Desk',
      })
      success('Return Request Created', 'Sent to Store Manager for inspection & authorization')
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      setCreateModalOpen(false)
      setReturnItems([])
      setOriginalInvoice('')
    } catch (err: any) {
      error('Failed to create return', err.message)
    }
  }

  // Manager Approve Refund
  const handleApproveRefund = async (r: SalesReturn) => {
    try {
      await salesService.approveRefund(r.id, user?.name || 'Manager')
      success('Refund Approved', `Refund ${r.returnNumber} finalized. Approved items returned to sellable stock.`)
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
    } catch (err: any) {
      error('Approval Failed', err.message)
    }
  }

  // Manager Reject Refund
  const handleRejectRefund = async (r: SalesReturn) => {
    const reason = prompt(`Reason for rejecting refund ${r.returnNumber}:`)
    if (reason) {
      try {
        await salesService.rejectRefund(r.id, user?.name || 'Manager', reason)
        warning('Refund Rejected', r.returnNumber)
        queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      } catch (err: any) {
        error('Rejection Failed', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Returns & Refund Approvals"
        description="Item-level return authorization, condition inspection, and safe quarantine / restocking workflows"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Process Return Request
          </Button>
        }
      />

      {/* Policy Card */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-start gap-3">
        <RotateCcw className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-blue-900 dark:text-blue-300">
            Inspection Protocol Notice
          </p>
          <p className="text-[#64748B] dark:text-[#9CA3AF] leading-relaxed">
            Returned products do not automatically re-enter active sellable inventory. Only items
            verified as pristine and authorized by manager inspection are added back to stock;
            damaged/expired goods are quarantined.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returns History & Approvals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#111827]/40 text-[#64748B] border-b border-[#E2E8F0] dark:border-[#374151] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Return Ref</th>
                  <th className="py-3 px-4">Original Invoice</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Returned Items & Reason</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      Loading return requests...
                    </td>
                  </tr>
                ) : returns?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      No return requests recorded.
                    </td>
                  </tr>
                ) : (
                  returns?.map((ret) => (
                    <tr key={ret.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#374151]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {ret.returnNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#9CA3AF]">
                        {ret.originalInvoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-[#1E293B] dark:text-[#F9FAFB]">
                        {ret.customerName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4">
                        {ret.items.map((i, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="font-semibold">{i.productName}</span> ({i.quantity} pcs)
                            — <span className="text-[#94A3B8]">{i.reason}</span>
                            {i.returnToInventory ? (
                              <span className="text-[10px] text-emerald-600 block">
                                ✓ Inspected for Restock
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-500 block">
                                ✕ Condemned/Disposed
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {formatCurrency(ret.totalRefundAmount)} ({ret.refundMethod})
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            ret.refundStatus === 'approved'
                              ? 'success'
                              : ret.refundStatus === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {ret.refundStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ret.refundStatus === 'pending_approval' && (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleApproveRefund(ret)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleRejectRefund(ret)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {ret.approvedBy && (
                          <span className="text-[10px] text-[#94A3B8] block">
                            By {ret.approvedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE RETURN MODAL */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Initiate Customer Return & Refund"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Original Invoice / Receipt Number"
              required
              value={originalInvoice}
              onChange={(e) => setOriginalInvoice(e.target.value)}
              placeholder="e.g. INV-2026-00901"
            />
            <Select
              label="Refund Method"
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
            >
              <option value="Cash">Cash Return</option>
              <option value="EVC Plus">EVC Plus Reversal</option>
              <option value="eDahab">eDahab Reversal</option>
              <option value="ZAAD">ZAAD Reversal</option>
              <option value="Card">Card Refund</option>
            </Select>
          </div>

          {/* Add Return Items Block */}
          <div className="p-3 rounded-xl border border-[#E2E8F0] dark:border-[#374151] bg-[#F8FAFC] dark:bg-[#1F2937]/50 space-y-3">
            <h4 className="text-xs font-semibold text-[#1E293B] dark:text-[#F9FAFB]">
              Add Item to Return
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Select
                label="Product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value)
                  const prod = productsData?.items.find((p) => p.id === e.target.value)
                  if (prod) setRefundPrice(prod.sellingPrice.toString())
                }}
              >
                <option value="">Choose product...</option>
                {(productsData?.items || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Return Reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as ReturnReason)}
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Qty Returned"
                type="number"
                min="1"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
              />
              <Input
                label="Unit Refund Price ($)"
                type="number"
                step="0.01"
                value={refundPrice}
                onChange={(e) => setRefundPrice(e.target.value)}
              />
            </div>

            <div className="pt-1">
              <Switch
                checked={returnToInventory}
                onChange={setReturnToInventory}
                label="Condition: Sealed / Sellable"
                description="If checked, item returns to sellable stock upon manager approval. If unchecked, quarantined."
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddReturnLine}
                disabled={!selectedProductId}
              >
                + Add Item to Return Basket
              </Button>
            </div>
          </div>

          {/* Current Return Basket */}
          {returnItems.length > 0 && (
            <div className="border border-[#E2E8F0] dark:border-[#374151] rounded-lg p-3 space-y-2 text-xs">
              <h5 className="font-semibold text-[#334155] dark:text-[#9CA3AF]">
                Items in Return Request ({returnItems.length})
              </h5>
              <div className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                {returnItems.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#111827] dark:text-[#F9FAFB]">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {item.quantity} × ${item.unitPrice.toFixed(2)} • {item.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">${item.refundAmount.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:opacity-80 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Inspection Notes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Verified receipt and packaging intact."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#374151]">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Return for Approval
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
