import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  FileSpreadsheet,
  Plus,
  PackageCheck,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  XCircle,
  Truck,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { purchaseOrderService } from '@/services/api/purchaseOrderService'
import { supplierService } from '@/services/api/supplierService'
import { productService } from '@/services/api/productService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { PurchaseOrder, POStatus } from '@/types'

export const PurchaseOrdersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { success, error, warning } = useToast()
  const [searchParams] = useSearchParams()

  const [createModalOpen, setCreateModalOpen] = React.useState(searchParams.get('action') === 'new')
  const [receiveModalPO, setReceiveModalPO] = React.useState<PurchaseOrder | null>(null)
  const [receivedInputs, setReceivedInputs] = React.useState<Record<string, number>>({})

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = React.useState('')
  const [expectedDate, setExpectedDate] = React.useState('')
  const [orderNotes, setOrderNotes] = React.useState('')
  const [orderItems, setOrderItems] = React.useState<
    { productId: string; quantityOrdered: number; unitCost: number }[]
  >([])

  // Queries
  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrderService.getPurchaseOrders(),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-for-po'],
    queryFn: () => productService.getProducts({ pageSize: 100 }),
  })

  // Add line item in PO Form
  const handleAddLineItem = () => {
    if (!productsData?.items || productsData.items.length === 0) return
    const first = productsData.items[0]
    setOrderItems([
      ...orderItems,
      { productId: first.id, quantityOrdered: 10, unitCost: first.costPrice },
    ])
  }

  const handleRemoveLineItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx))
  }

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...orderItems]
    if (field === 'productId') {
      const prod = productsData?.items.find((p) => p.id === value)
      updated[idx] = {
        ...updated[idx],
        productId: value,
        unitCost: prod ? prod.costPrice : updated[idx].unitCost,
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value }
    }
    setOrderItems(updated)
  }

  // Create PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) {
      error('Selection Required', 'Please select a supplier')
      return
    }
    if (orderItems.length === 0) {
      error('No Items Added', 'Add at least one product line item')
      return
    }

    try {
      await purchaseOrderService.createPO({
        supplierId: selectedSupplierId,
        items: orderItems,
        expectedDeliveryDate: expectedDate,
        notes: orderNotes,
        createdBy: user?.name || 'Staff User',
      })
      success('Purchase Order Created', 'PO submitted to supplier')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setCreateModalOpen(false)
      setOrderItems([])
    } catch (err: any) {
      error('Failed to create PO', err.message)
    }
  }

  // Open Receive Modal
  const handleOpenReceive = (po: PurchaseOrder) => {
    setReceiveModalPO(po)
    const map: Record<string, number> = {}
    po.items.forEach((item) => {
      const remaining = Math.max(0, item.quantityOrdered - item.quantityReceived)
      map[item.productId] = remaining
    })
    setReceivedInputs(map)
  }

  // Confirm Receiving (Backend automatically increases store inventory)
  const handleConfirmReceiving = async () => {
    if (!receiveModalPO) return

    const receivingPayload = Object.entries(receivedInputs).map(([productId, quantityReceivedNow]) => ({
      productId,
      quantityReceivedNow: Number(quantityReceivedNow) || 0,
    }))

    try {
      await purchaseOrderService.receivePOItems(
        receiveModalPO.id,
        receivingPayload,
        user?.name || 'Inventory Receiving Desk'
      )
      success(
        'Goods Confirmed Received',
        'Physical store inventory quantities updated automatically'
      )
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setReceiveModalPO(null)
    } catch (err: any) {
      error('Receiving Failed', err.message)
    }
  }

  // Cancel PO
  const handleCancelPO = async (po: PurchaseOrder) => {
    const reason = prompt(`Provide cancellation reason for ${po.poNumber}:`)
    if (reason) {
      try {
        await purchaseOrderService.cancelPO(po.id, user?.name || 'Manager', reason)
        success('Purchase Order Cancelled', po.poNumber)
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      } catch (err: any) {
        error('Cancellation Failed', err.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders & Receiving"
        description="Supplier procurement, partial receiving tracking, and automated stock receipt verification"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Purchase Order
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-center">Items (Rcvd/Ord)</th>
                  <th className="py-3 px-4 text-right">Order Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : purchaseOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No purchase orders registered.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders?.map((po) => {
                    const totalOrdered = po.items.reduce((s, i) => s + i.quantityOrdered, 0)
                    const totalReceived = po.items.reduce((s, i) => s + i.quantityReceived, 0)

                    return (
                      <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {po.poNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {po.supplierName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(po.createdAt)}</td>
                        <td className="py-3 px-4 text-center font-bold">
                          {totalReceived} / {totalOrdered}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(po.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              po.status === 'received'
                                ? 'success'
                                : po.status === 'partially_received'
                                ? 'info'
                                : po.status === 'cancelled'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {po.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {po.status !== 'received' && po.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenReceive(po)}
                              >
                                <PackageCheck className="h-3.5 w-3.5 mr-1" />
                                Receive Goods
                              </Button>
                            )}
                            {po.status === 'ordered' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelPO(po)}
                              >
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE PURCHASE ORDER MODAL */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Draft New Purchase Order"
        description="Select supplier and line items to replenish supermarket inventory"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Supplier"
              required
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">Choose Supplier...</option>
              {(suppliers || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.paymentTerms})
                </option>
              ))}
            </Select>

            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Purchase Order Line Items
              </label>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddLineItem}>
                + Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2 rounded-lg">
              {orderItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No items added yet. Click &quot;+ Add Item&quot; to begin.
                </p>
              ) : (
                orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {(productsData?.items || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantityOrdered}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantityOrdered', parseInt(e.target.value, 10) || 1)
                      }
                      className="w-20 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                    />

                    <input
                      type="number"
                      placeholder="Unit Cost"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) =>
                        handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                    />

                    <span className="w-20 text-right font-bold text-slate-900 dark:text-slate-100">
                      ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Input
            label="Internal Notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="e.g. Urgent weekend delivery required"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* RECEIVE GOODS MODAL */}
      <Dialog
        open={!!receiveModalPO}
        onClose={() => setReceiveModalPO(null)}
        title={`Receive Goods: ${receiveModalPO?.poNumber}`}
        description="Verify physically received quantities. Confirmed stock updates store inventory automatically."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {receiveModalPO?.items.map((item) => {
              const remaining = Math.max(0, item.quantityOrdered - item.quantityReceived)
              return (
                <div key={item.productId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ordered: {item.quantityOrdered} • Previously Received: {item.quantityReceived}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Receive Now:</span>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={receivedInputs[item.productId] ?? remaining}
                      onChange={(e) =>
                        setReceivedInputs({
                          ...receivedInputs,
                          [item.productId]: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-20 p-2 text-center font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setReceiveModalPO(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmReceiving}>
              Confirm Received Quantities into Inventory
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
