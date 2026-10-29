import * as React from 'react'
import JsBarcode from 'jsbarcode'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Product } from '@/types'

interface BarcodeGeneratorModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({ product, open, onClose }) => {
  const [copies, setCopies] = React.useState(1)
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  React.useEffect(() => {
    if (open && product && svgRef.current) {
      try {
        JsBarcode(svgRef.current, product.barcode || product.sku, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
        })
      } catch (err) {
        console.error('JsBarcode rendering error:', err)
      }
    }
  }, [open, product])

  if (!open || !product) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-2xl p-6 z-10 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#263449]">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Print Barcode Labels
            </h3>
            <p className="text-xs text-[#64748B]">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-6 flex flex-col items-center justify-center">
          <div className="printable-receipt-area p-4 bg-white border border-slate-300 rounded-lg shadow-xs text-center text-[#0F172A]">
            <p className="text-xs font-bold uppercase truncate max-w-[240px] mb-1">{product.name}</p>
            <svg ref={svgRef} className="mx-auto" />
            <p className="text-sm font-bold mt-1">${product.sellingPrice.toFixed(2)}</p>
          </div>

          <div className="mt-4 w-full max-w-xs">
            <Input
              type="number"
              min={1}
              max={100}
              label="Number of Label Copies"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print ({copies} {copies === 1 ? 'Label' : 'Labels'})
          </Button>
        </div>
      </div>
    </div>
  )
}
