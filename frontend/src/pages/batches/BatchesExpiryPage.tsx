import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, AlertTriangle, Trash2, Plus, ShieldAlert, CheckCircle2, PackageCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { inventoryService } from '@/services/api/inventoryService'
import { productService } from '@/services/api/productService'
import { formatDate } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'
import type { BatchLot } from '@/types'

export const BatchesExpiryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error, warning } = useToast()

  const [filter, setFilter] = React.useState('all')
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [disposeModalOpen, setDisposeModalOpen] = React.useState(false)
  const [selectedBatchForDisposal, setSelectedBatchForDisposal] = React.useState<BatchLot | null>(null)
  const [disposalReason, setDisposalReason] = React.useState('Past official expiration date - condemned')

  // Form fields
  const [selectedProductId, setSelectedProductId] = React.useState('')
  const [batchNumber, setBatchNumber] = React.useState('')
  const [mfgDate, setMfgDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [expiryDate, setExpiryDate] = React.useState('')
  const [initialQty, setInitialQty] = React.useState('50')
  const [costPrice, setCostPrice] = React.useState('1.50')

  const { data: batches, isLoading } = useQuery({
    queryKey: ['inventory-batches'],
    queryFn: () => inventoryService.getBatches(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-for-batches'],
    queryFn: () => productService.getProducts({ pageSize: 100 }),
  })

  const filteredBatches = React.useMemo(() => {
    if (!batches) return []
    if (filter === 'all') return batches
    return batches.filter((b) => b.status === filter)
  }, [batches, filter])

  // Count stats
  const expiredCount = batches?.filter((b) => b.status === 'expired').length || 0
  const nearExpiryCount = batches?.filter((b) => b.status === 'near_expiry').length || 0
  const activeCount = batches?.filter((b) => b.status === 'active').length || 0

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) {
      error('Selection Required', 'Please select a product')
      return
    }

    try {
      await inventoryService.createBatch({
        productId: selectedProductId,
        productName: productsData?.items.find((p) => p.id === selectedProductId)?.name || '',
        batchNumber: batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
        manufacturingDate: mfgDate,
        expiryDate,
        initialQuantity: parseInt(initialQty, 10) || 1,
        currentQuantity: parseInt(initialQty, 10) || 1,
        costPrice: parseFloat(costPrice) || 1.0,
      })
      success('Batch Registered', `Lot ${batchNumber} saved`)
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
      setCreateModalOpen(false)
    } catch (err: any) {
      error('Failed to create batch', err.message)
    }
  }

  const handleConfirmDisposal = async () => {
    if (!selectedBatchForDisposal) return
    try {
      await inventoryService.disposeBatch(selectedBatchForDisposal.id, disposalReason)
      success('Expired Batch Disposed', `Stock written off and removed from sellable inventory`)
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDisposeModalOpen(false)
      setSelectedBatchForDisposal(null)
    } catch (err: any) {
      error('Disposal Failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches & Expiry Dates (FEFO Protocol)"
        description="Lot number tracking, expiration date monitoring, First-Expired-First-Out (FEFO) enforcement and condemned stock write-offs"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Register Lot / Batch
          </Button>
        }
      />

      {/* FEFO Policy Reminder Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
        <PackageCheck className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-blue-900 dark:text-blue-300">
            Strict Single-Store FEFO Stock Allocation
          </p>
          <p className="text-[#64748B] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
            The Point of Sale automatically prevents the checkout of condemned or expired batches.
            Near-expiry batches (&lt;30 days) are prioritized for front-shelf sale or promotional discounts.
          </p>
        </div>
      </div>

      {/* Expiry Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('expired')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            filter === 'expired'
              ? 'border-red-500 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-500/20'
              : 'border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
              Expired (Condemned)
            </span>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mt-1">{expiredCount}</p>
          <p className="text-xs text-[#64748B] mt-0.5">Sale prohibited by backend</p>
        </button>

        <button
          onClick={() => setFilter('near_expiry')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            filter === 'near_expiry'
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
              : 'border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
              Near-Expiry (&lt;30 Days)
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mt-1">{nearExpiryCount}</p>
          <p className="text-xs text-[#64748B] mt-0.5">FEFO front-shelf prioritization</p>
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            filter === 'active'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              Optimal Safe Batches
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mt-1">{activeCount}</p>
          <p className="text-xs text-[#64748B] mt-0.5">Long shelf life remaining</p>
        </button>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Batch & Expiration Ledger</CardTitle>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Batches
            </Button>
            <Button
              size="sm"
              variant={filter === 'near_expiry' ? 'primary' : 'outline'}
              onClick={() => setFilter('near_expiry')}
            >
              Near Expiry
            </Button>
            <Button
              size="sm"
              variant={filter === 'expired' ? 'primary' : 'outline'}
              onClick={() => setFilter('expired')}
            >
              Expired
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#111827]/40 text-[#64748B] border-b border-[#E2E8F0] dark:border-[#374151] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Batch / Lot No</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Manufacturing Date</th>
                  <th className="py-3 px-4">Expiration Date</th>
                  <th className="py-3 px-4 text-center">Remaining / Initial</th>
                  <th className="py-3 px-4 text-center">FEFO Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#374151]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      Loading batch tracking records...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      No batches match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#374151]/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#111827] dark:text-[#F9FAFB]">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1E293B] dark:text-[#F9FAFB]">
                        {b.productName}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {formatDate(b.manufacturingDate)}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span
                          className={
                            b.status === 'expired'
                              ? 'text-red-600 font-bold'
                              : b.status === 'near_expiry'
                              ? 'text-amber-600 font-bold'
                              : 'text-[#334155] dark:text-[#9CA3AF]'
                          }
                        >
                          {formatDate(b.expiryDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#111827] dark:text-[#F9FAFB]">
                          {b.currentQuantity}
                        </span>{' '}
                        <span className="text-[#94A3B8]">/ {b.initialQuantity}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            b.status === 'expired'
                              ? 'danger'
                              : b.status === 'near_expiry'
                              ? 'warning'
                              : b.status === 'depleted'
                              ? 'secondary'
                              : 'success'
                          }
                          size="sm"
                        >
                          {b.status === 'expired'
                            ? 'Condemned / Expired'
                            : b.status === 'near_expiry'
                            ? 'Near Expiry (FEFO 1st)'
                            : b.status === 'depleted'
                            ? 'Depleted'
                            : 'Optimal Shelf Life'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === 'expired' && b.currentQuantity > 0 && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelectedBatchForDisposal(b)
                              setDisposeModalOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Dispose / Write Off
                          </Button>
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

      {/* REGISTER BATCH MODAL */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Manufacturing Batch / Lot"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <Select
            label="Product"
            required
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select product...</option>
            {(productsData?.items || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>

          <Input
            label="Batch / Lot Number"
            required
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="e.g. LOT-2026-MILK-12"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mfg Date"
              type="date"
              required
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Batch Initial Quantity"
              type="number"
              required
              value={initialQty}
              onChange={(e) => setInitialQty(e.target.value)}
            />
            <Input
              label="Unit Cost Price ($)"
              type="number"
              step="0.01"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Batch
            </Button>
          </div>
        </form>
      </Dialog>

      {/* DISPOSAL CONFIRMATION MODAL */}
      <Dialog
        open={disposeModalOpen}
        onClose={() => setDisposeModalOpen(false)}
        title="Condemn & Dispose Expired Stock"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 leading-relaxed">
            Writing off <strong>{selectedBatchForDisposal?.currentQuantity} units</strong> of{' '}
            <strong>{selectedBatchForDisposal?.productName}</strong> (Lot{' '}
            {selectedBatchForDisposal?.batchNumber}). This action will immediately decrement
            available physical store inventory and create a formal audit trail write-off.
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#334155] dark:text-[#9CA3AF]">
              Disposal Reason / Protocol
            </label>
            <textarea
              value={disposalReason}
              onChange={(e) => setDisposalReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDisposeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDisposal}>
              Confirm Write-Off & Disposal
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
