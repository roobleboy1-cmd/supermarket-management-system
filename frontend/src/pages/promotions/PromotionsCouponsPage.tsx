import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Percent, DollarSign, Calendar, Copy, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { promotionService } from '@/services/api/promotionService'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatCurrency } from '@/utils/formatters'
import type { Promotion, Coupon } from '@/types'

export const PromotionsCouponsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Coupon modal state
  const [couponModalOpen, setCouponModalOpen] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState('')
  const [couponType, setCouponType] = React.useState<'percentage' | 'fixed'>('percentage')
  const [couponVal, setCouponVal] = React.useState('10')
  const [minSpend, setMinSpend] = React.useState('20.00')
  const [usageLimit, setUsageLimit] = React.useState('200')
  const [validFrom, setValidFrom] = React.useState(new Date().toISOString().slice(0, 10))
  const [validTo, setValidTo] = React.useState('2026-12-31')

  // Promotion modal state
  const [promoModalOpen, setPromoModalOpen] = React.useState(false)
  const [promoTitle, setPromoTitle] = React.useState('')
  const [promoType, setPromoType] = React.useState<'percentage' | 'fixed_amount'>('percentage')
  const [promoValue, setPromoValue] = React.useState('15')
  const [promoMin, setPromoMin] = React.useState('10.00')
  const [promoValidFrom, setPromoValidFrom] = React.useState(new Date().toISOString().slice(0, 10))
  const [promoValidTo, setPromoValidTo] = React.useState('2026-11-30')

  const { data: promotions } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionService.getPromotions(),
  })

  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => promotionService.getCoupons(),
  })

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await promotionService.createCoupon({
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountValue: parseFloat(couponVal) || 0,
        minSpend: parseFloat(minSpend) || 0,
        usageLimit: parseInt(usageLimit, 10) || 100,
        validFrom,
        validTo,
      })
      success('Coupon Created', `Code ${couponCode} active`)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setCouponModalOpen(false)
      setCouponCode('')
    } catch (err: any) {
      error('Creation Failed', err.message)
    }
  }

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await promotionService.createPromotion({
        title: promoTitle,
        type: promoType,
        value: parseFloat(promoValue) || 0,
        minPurchaseAmount: parseFloat(promoMin) || 0,
        validFrom: promoValidFrom,
        validTo: promoValidTo,
        isActive: true,
      })
      success('Promotion Created', promoTitle)
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      setPromoModalOpen(false)
      setPromoTitle('')
    } catch (err: any) {
      error('Creation Failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions, Campaigns & Coupons"
        description="Checkout coupon codes, promotional discounts, minimum spend thresholds, and expiration controls"
      />

      <Tabs defaultValue="coupons">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="coupons">Checkout Coupons ({coupons?.length || 0})</TabsTrigger>
            <TabsTrigger value="promotions">Store Promotions ({promotions?.length || 0})</TabsTrigger>
          </TabsList>
        </div>

        {/* COUPONS TAB */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setCouponModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Coupon Code
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coupons || []).map((coup) => (
              <Card key={coup.id} className="hover:border-blue-500 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#3B82F6] dark:text-[#06B6D4] bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                      {coup.code}
                    </span>
                    <Badge variant={coup.status === 'active' ? 'success' : 'secondary'} size="sm">
                      {coup.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[#64748B]">Discount:</span>
                    <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {coup.discountType === 'percentage'
                        ? `${coup.discountValue}% OFF`
                        : `$${coup.discountValue.toFixed(2)} OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Min Order Spend:</span>
                    <span className="font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                      ${coup.minSpend.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Redemptions:</span>
                    <span className="font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                      {coup.timesUsed} / {coup.usageLimit} uses
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#263449] pt-2">
                    <span>Valid until:</span>
                    <span>{formatDate(coup.validTo)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PROMOTIONS TAB */}
        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setPromoModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Store Promotion
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(promotions || []).map((promo) => (
              <Card key={promo.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold">{promo.title}</CardTitle>
                  <Badge variant={promo.isActive ? 'success' : 'secondary'} size="sm">
                    {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <div className="flex justify-between">
                    <span>Benefit:</span>
                    <span className="font-bold text-emerald-600">
                      {promo.type === 'percentage'
                        ? `${promo.value}% Discount`
                        : `$${promo.value.toFixed(2)} Fixed Reduction`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Basket Amount:</span>
                    <span className="font-semibold">${promo.minPurchaseAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#263449] pt-2">
                    <span>Active Period:</span>
                    <span>
                      {formatDate(promo.validFrom)} – {formatDate(promo.validTo)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE COUPON MODAL */}
      <Dialog
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Create New Coupon Voucher"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <Input
            label="Coupon Code (Auto Uppercase)"
            required
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME20"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              value={couponType}
              onChange={(e) => setCouponType(e.target.value as any)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Dollar ($)</option>
            </Select>

            <Input
              label="Discount Value"
              type="number"
              step="0.01"
              required
              value={couponVal}
              onChange={(e) => setCouponVal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Minimum Order Spend ($)"
              type="number"
              step="0.01"
              required
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
            />
            <Input
              label="Usage Limit (Max Total Redemptions)"
              type="number"
              required
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valid From"
              type="date"
              required
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
            <Input
              label="Valid To"
              type="date"
              required
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#263449]">
            <Button type="button" variant="outline" onClick={() => setCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Coupon
            </Button>
          </div>
        </form>
      </Dialog>

      {/* CREATE PROMO MODAL */}
      <Dialog
        open={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Create Promotional Campaign"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <Input
            label="Promotion Title"
            required
            value={promoTitle}
            onChange={(e) => setPromoTitle(e.target.value)}
            placeholder="e.g. Weekend Dairy Rush - 10% OFF"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Benefit Type"
              value={promoType}
              onChange={(e) => setPromoType(e.target.value as any)}
            >
              <option value="percentage">Percentage Off (%)</option>
              <option value="fixed_amount">Fixed Amount ($)</option>
            </Select>

            <Input
              label="Discount Value"
              type="number"
              step="0.01"
              required
              value={promoValue}
              onChange={(e) => setPromoValue(e.target.value)}
            />
          </div>

          <Input
            label="Min Qualifying Spend ($)"
            type="number"
            value={promoMin}
            onChange={(e) => setPromoMin(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={promoValidFrom}
              onChange={(e) => setPromoValidFrom(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={promoValidTo}
              onChange={(e) => setPromoValidTo(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#263449]">
            <Button type="button" variant="outline" onClick={() => setPromoModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Launch Promotion
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
