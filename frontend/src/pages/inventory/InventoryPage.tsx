import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Boxes,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Truck,
  DollarSign,
  Search,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { inventoryService } from '@/services/api/inventoryService'
import { productService } from '@/services/api/productService'
import { formatCurrency } from '@/utils/formatters'

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState(filterParam || 'all')

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['inventory-overview'],
    queryFn: () => inventoryService.getOverview(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['inventory-products', { search, statusFilter }],
    queryFn: () =>
      productService.getProducts({
        search,
        lowStockOnly: statusFilter === 'low_stock',
        pageSize: 50,
      }),
  })

  const { data: reorderRecs } = useQuery({
    queryKey: ['inventory-reorders'],
    queryFn: () => inventoryService.getReorderRecommendations(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Stock & Smart Inventory"
        description="Single-store physical stock overview, valuation metrics, velocity, and AI reorder recommendations"
        actions={
          <div className="flex gap-2">
            <Link to="/stock-counts">
              <Button variant="outline" size="sm">
                <ClipboardList className="h-4 w-4 mr-1.5" />
                Physical Audits & Adjustments
              </Button>
            </Link>
            <Link to="/batches">
              <Button variant="outline" size="sm">
                <Boxes className="h-4 w-4 mr-1.5" />
                Batches & Expiry (FEFO)
              </Button>
            </Link>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stock Valuation (Cost)"
          value={formatCurrency(overview?.totalValuation || 0)}
          description={`${overview?.totalUnits || 0} total units in stock`}
          icon={Boxes}
          iconColor="text-[#3B82F6] bg-blue-100 dark:bg-blue-950 dark:text-[#06B6D4]"
        />
        <StatCard
          title="Retail Potential Value"
          value={formatCurrency(overview?.potentialRevenue || 0)}
          description={`Projected margin: ${formatCurrency(overview?.expectedMargin || 0)}`}
          icon={DollarSign}
          iconColor="text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <StatCard
          title="Low Stock Items"
          value={overview?.lowStockCount || 0}
          description="Items at or below safety stock"
          trend={{ value: 'Action Needed', isPositive: false }}
          icon={AlertTriangle}
          iconColor="text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400"
        />
        <StatCard
          title="Out of Stock Items"
          value={overview?.outOfStockCount || 0}
          description="Zero inventory on shelf"
          trend={{ value: 'Critical', isPositive: false }}
          icon={AlertTriangle}
          iconColor="text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400"
        />
      </div>

      {/* AI Smart Reorder Recommendations Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3B82F6] dark:text-[#06B6D4]" />
            <CardTitle>Automated Reorder Recommendations</CardTitle>
          </div>
          <Badge variant="primary">Calculated via Lead Time & Sales Velocity</Badge>
        </CardHeader>
        <CardContent>
          {!reorderRecs || reorderRecs.length === 0 ? (
            <p className="py-4 text-xs text-[#64748B]">
              All stock levels are currently healthy above minimum replenishment threshold.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
              {reorderRecs.map((rec) => (
                <div
                  key={rec.productId}
                  className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#111C31]/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono text-[#94A3B8]">{rec.sku}</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded">
                        {rec.currentStock} left (Min: {rec.minStockLevel})
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 line-clamp-1">
                      {rec.productName}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Supplier: {rec.supplierName}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Suggested Order:</span>
                      <span className="text-xs font-bold text-[#3B82F6] dark:text-[#06B6D4]">
                        {rec.suggestedReorderQty} units (~${rec.estimatedCost.toFixed(2)})
                      </span>
                    </div>
                    <Link to={`/purchases?action=new&productId=${rec.productId}`}>
                      <Button size="sm" variant="primary" className="text-xs h-7 px-2">
                        Create PO
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Overview Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle>Single Store Inventory Roster</CardTitle>
            <p className="text-xs text-[#64748B]">Live quantity on hand, unit cost valuation and status</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Filter inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31]"
            >
              <option value="all">All Items</option>
              <option value="low_stock">Low Stock Alerts Only</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FC] dark:bg-[#0B1220]/40 text-[#64748B] border-b border-[#E2E8F0] dark:border-[#263449] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Safety Level</th>
                  <th className="py-3 px-4 text-right">Cost Value</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-center">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
                {(productsData?.items || []).map((item) => {
                  const isOut = item.quantity === 0
                  const isLow = item.quantity <= item.minStockLevel && !isOut
                  const costVal = item.quantity * item.costPrice
                  const retailVal = item.quantity * item.sellingPrice

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#172338]/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{item.name}</div>
                        <div className="text-[11px] font-mono text-[#94A3B8]">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">
                        {item.categoryName || 'General'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center text-[#94A3B8] font-mono">
                        {item.minStockLevel} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${costVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        ${retailVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
