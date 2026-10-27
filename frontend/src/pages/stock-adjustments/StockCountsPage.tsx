import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, ArrowUpDown, History } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { inventoryService } from '@/services/api/inventoryService'
import { productService } from '@/services/api/productService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/utils/formatters'
import type { AdjustmentReason, PhysicalCount } from '@/types'

const REASONS: AdjustmentReason[] = [
  'Damaged Goods',
  'Theft / Missing',
  'Expired Stock',
  'Found Stock',
  'Data Correction',
  'Internal Store Consumption',
  'Supplier Return',
]

export const StockCountsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { success, error } = useToast()

  // Adjustment Modal State
  const [adjModalOpen, setAdjModalOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState('')
  const [adjType, setAdjType] = React.useState<'increase' | 'decrease'>('decrease')
  const [adjQty, setAdjQty] = React.useState('1')
  const [adjReason, setAdjReason] = React.useState<AdjustmentReason>('Damaged Goods')
  const [adjNotes, setAdjNotes] = React.useState('')

  // Physical Audit Count State
  const [countModalOpen, setCountModalOpen] = React.useState(false)
  const [auditNotes, setAuditNotes] = React.useState('Monthly store physical cycle audit')
  const [activeReconcileCount, setActiveReconcileCount] = React.useState<PhysicalCount | null>(null)
  const [countedQuantities, setCountedQuantities] = React.useState<Record<string, number>>({})

  // Queries
  const { data: adjustments, isLoading: adjLoading } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: () => inventoryService.getAdjustments(),
  })

  const { data: physicalCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['physical-counts'],
    queryFn: () => inventoryService.getPhysicalCounts(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-for-adjustments'],
    queryFn: () => productService.getProducts({ pageSize: 100 }),
  })

  // Submit Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      error('Selection Required', 'Please select a product')
      return
    }

    try {
      await inventoryService.adjustStock({
        productId: selectedProduct,
        type: adjType,
        quantity: parseInt(adjQty, 10) || 1,
        reason: adjReason,
        notes: adjNotes,
        performedBy: user?.name || 'Staff User',
      })
      success('Stock Adjusted', `Quantity updated with reason: ${adjReason}`)
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setAdjModalOpen(false)
    } catch (err: any) {
      error('Adjustment Failed', err.message)
    }
  }

  // Create Physical Count Audit
  const handleCreatePhysicalCount = async () => {
    try {
      const audit = await inventoryService.createPhysicalCount(auditNotes, user?.name || 'Inventory Manager')
      success('Physical Count Audit Initiated', `Audit Ref: ${audit.countReference}`)
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] })
      setCountModalOpen(false)
      // Open reconcile
      handleOpenReconcile(audit)
    } catch (err: any) {
      error('Audit Init Failed', err.message)
    }
  }

  // Open Reconcile Sheet
  const handleOpenReconcile = (count: PhysicalCount) => {
    setActiveReconcileCount(count)
    const initialMap: Record<string, number> = {}
    count.items.forEach((item) => {
      initialMap[item.productId] = item.countedQty
    })
    setCountedQuantities(initialMap)
  }

  // Submit Reconcile
  const handleConfirmReconciliation = async () => {
    if (!activeReconcileCount) return
    const items = Object.entries(countedQuantities).map(([productId, countedQty]) => ({
      productId,
      countedQty,
    }))

    try {
      await inventoryService.reconcilePhysicalCount(activeReconcileCount.id, items)
      success('Audit Reconciled', `Inventory figures reconciled against physical store counts`)
      queryClient.invalidateQueries({ queryKey: ['physical-counts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setActiveReconcileCount(null)
    } catch (err: any) {
      error('Reconcile Failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Adjustments & Physical Inventory Counts"
        description="Manual inventory adjustments with documented reason codes, physical audits, and variance reconciliation"
      />

      <Tabs defaultValue="adjustments">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="adjustments">Stock Adjustments Log</TabsTrigger>
            <TabsTrigger value="audits">Physical Audits & Variance</TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: ADJUSTMENTS */}
        <TabsContent value="adjustments" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setAdjModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Record Stock Adjustment
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adjustments History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-center">Adjusted Qty</th>
                      <th className="py-3 px-4">Reason Code</th>
                      <th className="py-3 px-4">Authorized By</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adjustments?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No manual stock adjustments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      adjustments?.map((adj) => (
                        <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500">{formatDate(adj.createdAt, true)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {adj.productName}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={adj.type === 'increase' ? 'success' : 'danger'} size="sm">
                              {adj.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {adj.type === 'increase' ? `+${adj.quantity}` : `-${adj.quantity}`}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {adj.reason}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{adj.adjustedBy}</td>
                          <td className="py-3 px-4 text-slate-400 italic">{adj.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PHYSICAL COUNTS / AUDITS */}
        <TabsContent value="audits" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setCountModalOpen(true)}>
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              Start New Inventory Count
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(physicalCounts || []).map((audit) => (
              <Card key={audit.id} className="hover:border-blue-500 transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm">{audit.countReference}</CardTitle>
                    <p className="text-xs text-slate-500">
                      Initiated by {audit.countedBy} on {formatDate(audit.createdAt, true)}
                    </p>
                  </div>
                  <Badge
                    variant={audit.status === 'reconciled' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {audit.status.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-center">
                    <div>
                      <span className="text-slate-400 block">Total Items</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{audit.totalItems}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Variances</span>
                      <span className="font-bold text-amber-600">{audit.discrepancyCount} Items</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Variance Value</span>
                      <span
                        className={`font-bold ${
                          audit.totalVarianceValue < 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        ${audit.totalVarianceValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic">{audit.notes || 'No notes'}</p>

                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReconcile(audit)}
                    >
                      {audit.status === 'reconciled' ? 'View Variance Sheet' : 'Enter Count & Reconcile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: RECORD ADJUSTMENT */}
      <Dialog
        open={adjModalOpen}
        onClose={() => setAdjModalOpen(false)}
        title="Record Stock Adjustment"
        description="All inventory adjustments must have an authorized reason"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <Select
            label="Product"
            required
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select product...</option>
            {(productsData?.items || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current: {p.quantity} {p.unit})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Adjustment Direction"
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as any)}
            >
              <option value="decrease">Decrease Stock (-)</option>
              <option value="increase">Increase Stock (+)</option>
            </Select>

            <Input
              label="Adjustment Quantity"
              type="number"
              min="1"
              required
              value={adjQty}
              onChange={(e) => setAdjQty(e.target.value)}
            />
          </div>

          <Select
            label="Adjustment Reason Code"
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value as AdjustmentReason)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Notes
            </label>
            <textarea
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              placeholder="e.g. Broken packaging discovered during shelf stocking..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAdjModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL: START AUDIT COUNT */}
      <Dialog
        open={countModalOpen}
        onClose={() => setCountModalOpen(false)}
        title="Initialize Physical Stock Audit"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            This creates an active physical count sheet of all {productsData?.items.length || 0} active
            products currently registered in this store. Staff can enter counted stock amounts and
            the backend calculates variances automatically.
          </p>
          <Input
            label="Audit Notes / Area Target"
            value={auditNotes}
            onChange={(e) => setAuditNotes(e.target.value)}
            placeholder="e.g. End of Month Full Supermarket Count"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePhysicalCount}>
              Create Audit Count Sheet
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL / SHEET: RECONCILE COUNT */}
      <Dialog
        open={!!activeReconcileCount}
        onClose={() => setActiveReconcileCount(null)}
        title={`Reconcile Audit: ${activeReconcileCount?.countReference}`}
        description="Verify physically counted items against store expected stock"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-semibold text-[11px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Expected Stock</th>
                  <th className="py-2.5 px-3 text-center">Counted Physical Stock</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeReconcileCount?.items.map((item) => {
                  const currentCounted = countedQuantities[item.productId] ?? item.expectedQty
                  const variance = currentCounted - item.expectedQty

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{item.sku}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                        {item.expectedQty}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          value={currentCounted}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            setCountedQuantities({
                              ...countedQuantities,
                              [item.productId]: isNaN(val) ? 0 : val,
                            })
                          }}
                          className="w-20 text-center py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span
                          className={
                            variance === 0
                              ? 'text-slate-400'
                              : variance < 0
                              ? 'text-red-600'
                              : 'text-emerald-600'
                          }
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActiveReconcileCount(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleConfirmReconciliation}>
              Confirm & Post Variances to Inventory
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
