import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  CalendarClock,
  ArrowUpRight,
  PlusCircle,
  Clock,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Package,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { dashboardService } from '@/services/api/dashboardService'
import { formatCurrency, formatDate } from '@/utils/formatters'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1']

export const DashboardPage: React.FC = () => {
  const [chartPeriod, setChartPeriod] = React.useState<'7d' | '30d' | '90d'>('7d')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 15000,
  })

  const { data: salesChart, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart', chartPeriod],
    queryFn: () => dashboardService.getSalesChart(chartPeriod),
  })

  const { data: paymentBreakdown } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: () => dashboardService.getPaymentBreakdown(),
  })

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardService.getTopSellingProducts(),
  })

  const { data: recentSales } = useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: () => dashboardService.getRecentSales(),
  })

  const { data: recentPurchases } = useQuery({
    queryKey: ['dashboard-recent-purchases'],
    queryFn: () => dashboardService.getRecentPurchases(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supermarket Dashboard"
        description="Live operational telemetry, gross profit, cash drawer status, and inventory alerts"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/pos">
              <Button variant="primary" size="sm">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Open POS Terminal
              </Button>
            </Link>
            <Link to="/products?action=new">
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add Product
              </Button>
            </Link>
            <Link to="/purchases?action=new">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Record Purchase
              </Button>
            </Link>
            <Link to="/stock-counts">
              <Button variant="outline" size="sm">
                <Boxes className="h-4 w-4 mr-1.5" />
                Adjust Stock
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Today's Sales Revenue"
              value={formatCurrency(stats?.todaySalesRevenue || 0)}
              description={`${stats?.todayTransactionCount || 0} transactions processed`}
              trend={{ value: '+14.2% vs yesterday', isPositive: true }}
              icon={DollarSign}
              iconColor="text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400"
            />
            <StatCard
              title="Today's Gross Profit"
              value={formatCurrency(stats?.todayGrossProfit || 0)}
              description={`Avg ticket: ${formatCurrency(stats?.avgTransactionValue || 0)}`}
              trend={{ value: 'Healthy ~32% margin', isPositive: true }}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
            />
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(stats?.totalInventoryValuation || 0)}
              description={`${stats?.totalProducts || 0} Products in ${stats?.totalCategories || 0} Categories`}
              icon={Boxes}
              iconColor="text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
            />
            <StatCard
              title="Shift Status"
              value={stats?.currentShiftActive ? 'Shift Open' : 'Shift Closed'}
              description={stats?.activeShiftCashier ? `Active Cashier: ${stats.activeShiftCashier}` : 'No cashier drawer active'}
              icon={Clock}
              iconColor={
                stats?.currentShiftActive
                  ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400'
              }
            />
          </>
        )}
      </div>

      {/* Critical Operational Banner Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/inventory?filter=low_stock"
          className="flex items-center justify-between p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 hover:border-amber-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Low Stock & Out of Stock
              </p>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                {stats?.lowStockCount || 0} Low • {stats?.outOfStockCount || 0} Out
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-600" />
        </Link>

        <Link
          to="/batches?filter=near_expiry"
          className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 hover:border-red-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-900 dark:text-red-300">
                Expiring Batches (&lt;30 days)
              </p>
              <p className="text-sm font-bold text-red-950 dark:text-red-100">
                {stats?.approachingExpiryCount || 0} Batches require FEFO sale
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-red-600" />
        </Link>

        <Link
          to="/returns?status=pending_approval"
          className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 hover:border-blue-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Pending Manager Approvals
              </p>
              <p className="text-sm font-bold text-blue-950 dark:text-blue-100">
                {stats?.pendingRefundCount || 0} Refunds • {stats?.outstandingPoCount || 0} POs Ordered
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-blue-600" />
        </Link>
      </div>

      {/* Sales Trend Chart & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Sales Revenue & Gross Profit Trend</CardTitle>
              <p className="text-xs text-slate-500">
                Real-time transactions aggregated for this store
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setChartPeriod('7d')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  chartPeriod === '7d' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  chartPeriod === '30d' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setChartPeriod('90d')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  chartPeriod === '90d' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                90 Days
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                    <XAxis dataKey="date" className="text-xs" stroke="#94A3B8" />
                    <YAxis className="text-xs" stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`$${val}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Sales Revenue"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Gross Profit"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Payment Method</CardTitle>
            <p className="text-xs text-slate-500">EVC Plus, eDahab, ZAAD, Card & Cash</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown || []}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={68}
                    innerRadius={42}
                    paddingAngle={3}
                  >
                    {(paymentBreakdown || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`$${val}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#F8FAFC',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-1.5 mt-2">
              {(paymentBreakdown || []).map((item, idx) => (
                <div key={item.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      ${item.total.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Store Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Checkout Sales</CardTitle>
              <p className="text-xs text-slate-500">Latest completed receipts</p>
            </div>
            <Link to="/sales" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Sales
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentSales || []).map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {sale.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Cashier: {sale.cashierName} • {formatDate(sale.createdAt, true)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      ${sale.total.toFixed(2)}
                    </p>
                    <Badge variant="success" size="sm">
                      {sale.payments[0]?.method || 'Paid'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Velocity Products</CardTitle>
              <p className="text-xs text-slate-500">Highest volume items</p>
            </div>
            <Link to="/products" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage Catalog
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(topProducts || []).map((prod: any, idx: number) => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">{prod.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {prod.unitsSold} sold
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ${prod.revenue.toFixed(2)} rev
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
