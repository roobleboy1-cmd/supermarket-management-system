import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { shiftService } from '@/services/api/shiftService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { CashierShift, CashMovementType } from '@/types'

export const CashierShiftsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { success, error, warning } = useToast()

  // Modals
  const [openShiftModal, setOpenShiftModal] = React.useState(false)
  const [openingFloat, setOpeningFloat] = React.useState('150.00')

  const [closeShiftModal, setCloseShiftModal] = React.useState(false)
  const [countedCash, setCountedCash] = React.useState('')
  const [closingNotes, setClosingNotes] = React.useState('')

  const [cashMovementModal, setCashMovementModal] = React.useState(false)
  const [movementType, setMovementType] = React.useState<CashMovementType>('pay_in')
  const [movementAmount, setMovementAmount] = React.useState('50.00')
  const [movementReason, setMovementReason] = React.useState('Additional float exchange')

  const [selectedShiftForReport, setSelectedShiftForReport] = React.useState<CashierShift | null>(null)

  // Queries
  const { data: currentShift, isLoading: shiftLoading } = useQuery({
    queryKey: ['active-shift'],
    queryFn: () => shiftService.getCurrentShift(),
  })

  const { data: shiftHistory } = useQuery({
    queryKey: ['shift-history'],
    queryFn: () => shiftService.getShifts(),
  })

  // Open shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()
    const floatNum = parseFloat(openingFloat) || 0
    try {
      await shiftService.openShift(floatNum, user?.id || 'u-cashier', user?.name || 'Cashier')
      success('Shift Opened', `Float of $${floatNum.toFixed(2)} recorded into cash drawer`)
      queryClient.invalidateQueries({ queryKey: ['active-shift'] })
      queryClient.invalidateQueries({ queryKey: ['shift-history'] })
      setOpenShiftModal(false)
    } catch (err: any) {
      error('Failed to Open Shift', err.message)
    }
  }

  // Cash movement (Pay-in / Drop-out)
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShift) return
    const amt = parseFloat(movementAmount) || 0

    try {
      await shiftService.addCashMovement(currentShift.id, {
        type: movementType,
        amount: amt,
        reason: movementReason,
        authorizedBy: user?.name || 'Manager',
      })
      success('Cash Drawer Movement Recorded', `$${amt.toFixed(2)} (${movementType})`)
      queryClient.invalidateQueries({ queryKey: ['active-shift'] })
      setCashMovementModal(false)
    } catch (err: any) {
      error('Movement Failed', err.message)
    }
  }

  // Close shift
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShift) return
    const counted = parseFloat(countedCash) || 0

    try {
      await shiftService.closeShift(currentShift.id, counted, closingNotes)
      success('Shift Closed & Submitted', 'Awaiting Store Manager reconciliation approval')
      queryClient.invalidateQueries({ queryKey: ['active-shift'] })
      queryClient.invalidateQueries({ queryKey: ['shift-history'] })
      setCloseShiftModal(false)
      setCountedCash('')
    } catch (err: any) {
      error('Shift Close Failed', err.message)
    }
  }

  // Approve Shift
  const handleApproveShift = async (s: CashierShift) => {
    try {
      await shiftService.approveShift(s.id, user?.name || 'Store Manager')
      success('Shift Reconciliation Approved', s.shiftNumber)
      queryClient.invalidateQueries({ queryKey: ['active-shift'] })
      queryClient.invalidateQueries({ queryKey: ['shift-history'] })
    } catch (err: any) {
      error('Approval Failed', err.message)
    }
  }

  const isShiftOpen = currentShift && currentShift.status === 'open'
  const expectedCash = currentShift ? currentShift.expectedClosingCash : 0
  const countedNum = parseFloat(countedCash) || 0
  const discrepancyPreview = countedNum - expectedCash

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashier Shifts & Drawer Balancing"
        description="Cash float initialization, mid-shift drops & pay-ins, blind cash counts, shortage/overage calculations, and manager sign-off"
        actions={
          isShiftOpen ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCashMovementModal(true)}
              >
                Cash In / Drop Out
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCloseShiftModal(true)}
              >
                <Lock className="h-4 w-4 mr-1.5" />
                Close Shift Drawer
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setOpenShiftModal(true)}>
              <Unlock className="h-4 w-4 mr-1.5" />
              Open New Shift Drawer
            </Button>
          )
        }
      />

      {/* ACTIVE SHIFT SUMMARY CARD */}
      {isShiftOpen ? (
        <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <CardTitle className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Active Cashier Shift: {currentShift.shiftNumber}
                </CardTitle>
                <p className="text-xs text-[#64748B]">
                  Cashier: <strong>{currentShift.cashierName}</strong> • Opened:{' '}
                  {formatDate(currentShift.openingTime, true)}
                </p>
              </div>
            </div>
            <Badge variant="success">DRAWER OPEN</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449]">
                <span className="text-[#94A3B8] block text-[11px]">Opening Cash Float</span>
                <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {formatCurrency(currentShift.openingCash)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449]">
                <span className="text-[#94A3B8] block text-[11px]">Cash Sales Taken</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentShift.cashSales)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449]">
                <span className="text-[#94A3B8] block text-[11px]">EVC / Mobile / Card</span>
                <span className="text-base font-bold text-[#3B82F6] dark:text-[#06B6D4]">
                  {formatCurrency(currentShift.mobileSales + currentShift.cardSales)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                <span className="text-blue-700 dark:text-blue-300 block text-[11px] font-semibold">
                  Expected Drawer Cash
                </span>
                <span className="text-base font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(currentShift.expectedClosingCash)}
                </span>
              </div>
            </div>

            {/* Shift Cash Movements */}
            {currentShift.movements && currentShift.movements.length > 0 && (
              <div className="border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-3 space-y-1.5 text-xs bg-white dark:bg-[#111C31]">
                <h5 className="font-semibold text-[#334155] dark:text-[#94A3B8]">
                  Cash In / Drop Movements Log
                </h5>
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
                  {currentShift.movements.map((m) => (
                    <div key={m.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {m.type === 'pay_in' ? (
                          <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                        ) : m.type === 'drop_out' ? (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                        )}
                        <span>{m.reason}</span>
                      </div>
                      <span className="font-bold font-mono">
                        {m.type === 'drop_out' ? `-${formatCurrency(m.amount)}` : `+${formatCurrency(m.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-[#F5F7FC]/50 dark:bg-[#111C31]/50 border-dashed">
          <Clock className="h-10 w-10 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            No Cashier Shift Currently Active
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            To begin processing sales at the checkout counter, initialize a shift drawer with the opening float.
          </p>
          <Button variant="primary" size="sm" onClick={() => setOpenShiftModal(true)}>
            <Unlock className="h-4 w-4 mr-1.5" />
            Open Cashier Shift
          </Button>
        </Card>
      )}

      {/* SHIFT HISTORY & RECONCILIATIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Reconciliation History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FC] dark:bg-[#0B1220]/40 text-[#64748B] border-b border-[#E2E8F0] dark:border-[#263449] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Shift Ref</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Opened / Closed</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Expected Cash</th>
                  <th className="py-3 px-4 text-right">Actual Counted</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
                {(shiftHistory || []).map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#172338]/40">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {s.shiftNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                      {s.cashierName}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      <div>{formatDate(s.openingTime, true)}</div>
                      {s.closingTime && <div className="text-[10px] text-[#94A3B8]">Closed: {formatDate(s.closingTime, true)}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatCurrency(s.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatCurrency(s.expectedClosingCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.actualClosingCash !== undefined ? formatCurrency(s.actualClosingCash) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.discrepancy !== undefined ? (
                        <span
                          className={
                            s.discrepancy === 0
                              ? 'text-emerald-600'
                              : s.discrepancy < 0
                              ? 'text-red-600'
                              : 'text-[#3B82F6]'
                          }
                        >
                          {s.discrepancy > 0 ? `+${s.discrepancy.toFixed(2)}` : s.discrepancy.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          s.status === 'closed'
                            ? 'success'
                            : s.status === 'open'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {s.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedShiftForReport(s)}
                          title="Printable Shift Report"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        {s.status === 'pending_approval' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveShift(s)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Sign Off
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* OPEN SHIFT MODAL */}
      <Dialog
        open={openShiftModal}
        onClose={() => setOpenShiftModal(false)}
        title="Open Cashier Shift Drawer"
        maxWidth="md"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <Input
            label="Opening Cash Float ($)"
            type="number"
            step="0.01"
            required
            value={openingFloat}
            onChange={(e) => setOpeningFloat(e.target.value)}
            placeholder="150.00"
            helperText="Physical coins and dollar bills placed in register at shift start"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenShiftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Verify Float & Open Drawer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* CASH MOVEMENT MODAL (PAY IN / DROP OUT) */}
      <Dialog
        open={cashMovementModal}
        onClose={() => setCashMovementModal(false)}
        title="Record Mid-Shift Cash Movement"
        maxWidth="md"
      >
        <form onSubmit={handleAddMovement} className="space-y-4">
          <Select
            label="Movement Type"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as CashMovementType)}
          >
            <option value="pay_in">Pay-In (Add cash float into drawer)</option>
            <option value="drop_out">Safe Drop / Drop-Out (Remove excess cash to safe)</option>
          </Select>
          <Input
            label="Amount ($)"
            type="number"
            step="0.01"
            required
            value={movementAmount}
            onChange={(e) => setMovementAmount(e.target.value)}
          />
          <Input
            label="Reason / Authorized Note"
            required
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
            placeholder="e.g. Mid-day safe drop of excess $100 bills"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCashMovementModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Post Cash Movement
            </Button>
          </div>
        </form>
      </Dialog>

      {/* CLOSE SHIFT MODAL */}
      <Dialog
        open={closeShiftModal}
        onClose={() => setCloseShiftModal(false)}
        title="Close Register Drawer & Blind Cash Count"
        maxWidth="md"
      >
        <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Expected Physical Cash in Drawer:</span>
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                ${expectedCash.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#94A3B8]">
              <span>Formula: Opening Float + Cash Sales + Pay-ins - Safe Drops</span>
            </div>
          </div>

          <Input
            label="Actual Physically Counted Cash ($)"
            type="number"
            step="0.01"
            required
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            placeholder="Count drawer cash..."
            autoFocus
          />

          {countedCash !== '' && (
            <div className="p-3 rounded-lg border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
              <span className="font-medium text-[#334155] dark:text-[#94A3B8]">
                Calculated Drawer Discrepancy:
              </span>
              <span
                className={`font-bold text-sm ${
                  discrepancyPreview === 0
                    ? 'text-emerald-600'
                    : discrepancyPreview < 0
                    ? 'text-red-600'
                    : 'text-[#3B82F6]'
                }`}
              >
                {discrepancyPreview >= 0
                  ? `+$${discrepancyPreview.toFixed(2)} (Overage)`
                  : `-$${Math.abs(discrepancyPreview).toFixed(2)} (Shortage)`}
              </span>
            </div>
          )}

          <Input
            label="Closing Shift Notes / Explanations"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. Accurate drawer count conducted before evening shift handoff"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#263449]">
            <Button type="button" variant="outline" onClick={() => setCloseShiftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Lock Drawer & Submit Reconciliation
            </Button>
          </div>
        </form>
      </Dialog>

      {/* PRINTABLE DAILY SHIFT REPORT PREVIEW */}
      <Dialog
        open={!!selectedShiftForReport}
        onClose={() => setSelectedShiftForReport(null)}
        title="Daily Cashier Shift Report"
        maxWidth="md"
      >
        {selectedShiftForReport && (
          <div className="space-y-4 text-xs font-mono">
            <div className="printable-receipt-area p-4 bg-white text-[#0F172A] border rounded-lg space-y-2 leading-relaxed">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h3 className="text-sm font-bold uppercase">DAILY CASHIER SHIFT REPORT</h3>
                <p className="text-[10px]">SomSupermarket Central</p>
                <p className="text-[10px]">Shift Ref: {selectedShiftForReport.shiftNumber}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-bold">{selectedShiftForReport.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{formatDate(selectedShiftForReport.openingTime, true)}</span>
                </div>
                {selectedShiftForReport.closingTime && (
                  <div className="flex justify-between">
                    <span>Closed:</span>
                    <span>{formatDate(selectedShiftForReport.closingTime, true)}</span>
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{formatCurrency(selectedShiftForReport.openingCash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Cash Sales:</span>
                  <span>{formatCurrency(selectedShiftForReport.cashSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Sales:</span>
                  <span>{formatCurrency(selectedShiftForReport.cardSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile (EVC/eDahab/ZAAD):</span>
                  <span>{formatCurrency(selectedShiftForReport.mobileSales)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-[#CBD5E1] pt-1">
                  <span>TOTAL SALES:</span>
                  <span>{formatCurrency(selectedShiftForReport.totalSales)}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Expected Drawer Cash:</span>
                  <span>{formatCurrency(selectedShiftForReport.expectedClosingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted Cash:</span>
                  <span>
                    {selectedShiftForReport.actualClosingCash !== undefined
                      ? formatCurrency(selectedShiftForReport.actualClosingCash)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Drawer Discrepancy:</span>
                  <span>
                    {selectedShiftForReport.discrepancy !== undefined
                      ? formatCurrency(selectedShiftForReport.discrepancy)
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-[#64748B]">
                <p>Status: {selectedShiftForReport.status.toUpperCase()}</p>
                {selectedShiftForReport.approvedBy && (
                  <p>Manager Sign-off: {selectedShiftForReport.approvedBy}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedShiftForReport(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print Shift Report
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
