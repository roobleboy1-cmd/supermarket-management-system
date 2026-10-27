import * as React from 'react'
import { Printer, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Sale } from '@/types'
import { localStore } from '@/services/dataStore'

interface ThermalReceiptModalProps {
  sale: Sale | null
  open: boolean
  onClose: () => void
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ sale, open, onClose }) => {
  const [paperWidth, setPaperWidth] = React.useState<'58mm' | '80mm'>('80mm')
  const settings = localStore.settings

  if (!open || !sale) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 flex flex-col max-h-[95vh]">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Thermal Receipt Print Preview
            </h3>
            <p className="text-xs text-slate-500">Invoice: {sale.invoiceNumber}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  paperWidth === '58mm'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  paperWidth === '80mm'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                80 mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto py-4 flex justify-center bg-slate-100 dark:bg-slate-950/60 rounded-lg my-3 p-4">
          <div
            className={`printable-receipt-area bg-white text-slate-900 p-4 font-mono text-[11px] leading-relaxed shadow-md border border-slate-200 ${
              paperWidth === '58mm' ? 'w-[240px]' : 'w-[320px]'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="text-sm font-bold uppercase tracking-wider">{settings.storeName}</h2>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
              <p className="text-[10px] text-slate-600">Tax/VAT No: {settings.taxNumber}</p>
              <p className="mt-1 text-[10px] whitespace-pre-line">{settings.receiptHeader}</p>
            </div>

            {/* Meta info */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(sale.createdAt, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px]">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1 truncate max-w-[110px]" title={item.name}>
                        {item.name}
                      </td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-1 text-right font-medium">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discountAmount, settings.currency)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax/VAT:</span>
                  <span>{formatCurrency(sale.taxAmount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.total, settings.currency)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              {sale.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>Payment ({p.method}):</span>
                  <span>{formatCurrency(p.amount, settings.currency)}</span>
                </div>
              ))}
              {sale.cashReceived && (
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(sale.cashReceived, settings.currency)}</span>
                </div>
              )}
              {sale.changeDue !== undefined && (
                <div className="flex justify-between font-bold">
                  <span>Change Given:</span>
                  <span>{formatCurrency(sale.changeDue, settings.currency)}</span>
                </div>
              )}
            </div>

            {/* Barcode representation */}
            <div className="pt-3 text-center">
              <div className="inline-block tracking-widest font-mono text-[11px] border border-slate-800 px-3 py-1 bg-slate-50 font-bold">
                *{sale.invoiceNumber}*
              </div>
              <p className="mt-2 text-[9px] text-slate-500 whitespace-pre-line leading-tight">
                {settings.receiptFooter}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt ({paperWidth})
          </Button>
        </div>
      </div>
    </div>
  )
}
