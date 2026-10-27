// User & Roles
export type Role =
  | 'Super Admin'
  | 'Manager'
  | 'Inventory Manager'
  | 'Cashier'
  | 'Accountant'
  | 'Auditor'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: string
  createdAt: string
}

// Product & Catalog
export type UnitOfMeasure = 'pcs' | 'kg' | 'g' | 'litre' | 'ml' | 'box' | 'pack' | 'carton' | 'bottle'
export type ProductStatus = 'active' | 'archived' | 'discontinued'

export interface Category {
  id: string
  name: string
  code: string
  description?: string
  productCount: number
  createdAt: string
}

export interface Brand {
  id: string
  name: string
  code: string
  description?: string
  logo?: string
  productCount: number
  createdAt: string
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  description?: string
  categoryId: string
  categoryName?: string
  brandId?: string
  brandName?: string
  unit: UnitOfMeasure
  costPrice: number
  sellingPrice: number
  quantity: number
  minStockLevel: number
  supplierId?: string
  supplierName?: string
  trackExpiry: boolean
  taxRate: number // e.g. 0, 5, 10
  imageUrl?: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'audit' | 'damage'
  quantityChange: number // negative for sales/damage, positive for purchase
  previousQty: number
  newQty: number
  reason?: string
  referenceNo?: string
  performedBy: string
  createdAt: string
}

// Inventory & Batches
export interface BatchLot {
  id: string
  productId: string
  productName: string
  batchNumber: string
  manufacturingDate: string
  expiryDate: string
  initialQuantity: number
  currentQuantity: number
  costPrice: number
  status: 'active' | 'near_expiry' | 'expired' | 'depleted'
  createdAt: string
}

export type AdjustmentReason =
  | 'Damaged Goods'
  | 'Theft / Missing'
  | 'Expired Stock'
  | 'Found Stock'
  | 'Data Correction'
  | 'Internal Store Consumption'
  | 'Supplier Return'

export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  sku: string
  type: 'increase' | 'decrease'
  quantity: number
  reason: AdjustmentReason
  notes?: string
  adjustedBy: string
  createdAt: string
}

export interface PhysicalCountItem {
  productId: string
  productName: string
  sku: string
  expectedQty: number
  countedQty: number
  variance: number // counted - expected
  unitCost: number
  varianceValue: number
}

export interface PhysicalCount {
  id: string
  countReference: string
  status: 'in_progress' | 'completed' | 'reconciled' | 'cancelled'
  totalItems: number
  discrepancyCount: number
  totalVarianceValue: number
  countedBy: string
  notes?: string
  items: PhysicalCountItem[]
  createdAt: string
  completedAt?: string
}

export interface ReorderRecommendation {
  productId: string
  productName: string
  sku: string
  currentStock: number
  minStockLevel: number
  avgDailySales: number
  leadTimeDays: number
  suggestedReorderQty: number
  supplierName: string
  supplierId: string
  estimatedCost: number
}

// POS & Cart
export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'EVC Plus'
  | 'eDahab'
  | 'ZAAD'
  | 'Bank Transfer'
  | 'Split'

export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  barcode: string
  unitPrice: number
  costPrice: number
  quantity: number
  discount: number // percentage or fixed
  taxRate: number
  taxAmount: number
  subtotal: number
  total: number
  unit: UnitOfMeasure
  batchId?: string
  maxStock: number
}

export interface PaymentSplit {
  method: PaymentMethod
  amount: number
  reference?: string
}

export interface SuspendedSale {
  id: string
  holdReference: string
  customer?: Customer | null
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  notes?: string
  createdAt: string
}

export interface QueuedTransaction {
  idempotencyKey: string
  receiptNumber: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  payments: PaymentSplit[]
  cashReceived?: number
  changeDue?: number
  customerId?: string
  customerName?: string
  cashierId: string
  cashierName: string
  shiftId: string
  status: 'pending' | 'synchronized' | 'rejected' | 'failed'
  errorMessage?: string
  createdAt: string
  updatedAt?: string
}

// Sales & Returns
export interface Sale {
  id: string
  invoiceNumber: string
  cashierId: string
  cashierName: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  payments: PaymentSplit[]
  cashReceived?: number
  changeDue?: number
  paymentStatus: 'paid' | 'partial' | 'refunded' | 'voided'
  shiftId: string
  notes?: string
  createdAt: string
}

export type ReturnReason =
  | 'Defective / Damaged'
  | 'Expired Product'
  | 'Wrong Product Purchased'
  | 'Customer Regret'
  | 'Incorrect Price Charged'
  | 'Other'

export interface ReturnItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  refundAmount: number
  reason: ReturnReason
  returnToInventory: boolean // sellable inspection result
}

export interface SalesReturn {
  id: string
  returnNumber: string
  originalInvoiceNumber: string
  saleId: string
  customerName?: string
  customerPhone?: string
  items: ReturnItem[]
  totalRefundAmount: number
  refundMethod: PaymentMethod
  refundStatus: 'pending_approval' | 'approved' | 'rejected' | 'completed'
  inspectedBy: string
  approvedBy?: string
  notes?: string
  createdAt: string
}

// Suppliers & Purchase Orders
export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxId?: string
  paymentTerms: string // e.g. "Net 30", "Cash on Delivery"
  currentBalance: number
  status: 'active' | 'inactive'
  createdAt: string
}

export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export interface POLineItem {
  productId: string
  productName: string
  sku: string
  quantityOrdered: number
  quantityReceived: number
  unitCost: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: POStatus
  items: POLineItem[]
  totalAmount: number
  paidAmount: number
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid'
  expectedDeliveryDate?: string
  notes?: string
  createdBy: string
  receivedAt?: string
  createdAt: string
}

// Customers & Loyalty
export type CustomerTier = 'Standard' | 'Silver' | 'Gold' | 'Platinum'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  loyaltyPoints: number
  tier: CustomerTier
  totalSpent: number
  totalVisits: number
  createdAt: string
}

export interface LoyaltyTransaction {
  id: string
  customerId: string
  type: 'earned' | 'redeemed' | 'adjusted'
  points: number
  balanceAfter: number
  invoiceNumber?: string
  description: string
  createdAt: string
}

// Cashier Shifts
export type CashMovementType = 'pay_in' | 'drop_out' | 'drawer_start' | 'drawer_end'

export interface CashMovement {
  id: string
  shiftId: string
  type: CashMovementType
  amount: number
  reason: string
  authorizedBy: string
  createdAt: string
}

export interface CashierShift {
  id: string
  shiftNumber: string
  cashierId: string
  cashierName: string
  status: 'open' | 'pending_approval' | 'closed'
  openingTime: string
  closingTime?: string
  openingCash: number
  totalSales: number
  cashSales: number
  cardSales: number
  mobileSales: number // EVC Plus / eDahab / ZAAD
  cashIn: number
  cashOut: number
  expectedClosingCash: number
  actualClosingCash?: number
  discrepancy?: number // actual - expected
  approvedBy?: string
  notes?: string
  movements: CashMovement[]
}

// Expenses
export type ExpenseCategory =
  | 'Rent'
  | 'Electricity & Water'
  | 'Staff Salaries'
  | 'Equipment & Maintenance'
  | 'Packaging & Supplies'
  | 'Security'
  | 'Taxes & Licenses'
  | 'Other Operating Expense'

export interface Expense {
  id: string
  expenseNumber: string
  title: string
  category: ExpenseCategory
  amount: number
  paymentMethod: PaymentMethod
  expenseDate: string
  paidTo: string
  receiptReference?: string
  notes?: string
  recordedBy: string
  createdAt: string
}

// Promotions & Coupons
export interface Promotion {
  id: string
  title: string
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y'
  value: number // e.g. 15 for 15%
  minPurchaseAmount?: number
  validFrom: string
  validTo: string
  isActive: boolean
  applicableCategoryIds?: string[]
  applicableProductIds?: string[]
  createdAt: string
}

export interface Coupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minSpend: number
  maxDiscount?: number
  usageLimit: number
  timesUsed: number
  validFrom: string
  validTo: string
  status: 'active' | 'expired' | 'depleted'
  createdAt: string
}

// Notifications & Activity Logs
export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'low_stock' | 'expiry' | 'purchase' | 'refund' | 'shift' | 'system'
  read: boolean
  actionUrl?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  actorId: string
  actorName: string
  role: Role
  action: string
  module: string
  ipAddress?: string
  details: string
  timestamp: string
}

// Store Settings (Single Store Only)
export interface StoreSettings {
  storeName: string
  tagline: string
  logoUrl?: string
  phone: string
  email: string
  address: string
  city: string
  taxNumber: string
  currency: 'USD' | 'SOS'
  timezone: string
  defaultTaxRate: number
  taxInclusive: boolean
  thermalPrinterType: '58mm' | '80mm'
  receiptHeader: string
  receiptFooter: string
  lowStockThresholdDefault: number
  expiryAlertDaysDefault: number
  loyaltyPointsPerDollar: number // e.g. 1 point per $1
  loyaltyRedemptionRate: number // e.g. 100 points = $1.00
  enabledPaymentMethods: PaymentMethod[]
}

// Reports & Summaries
export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  todaySalesRevenue: number
  todayGrossProfit: number
  todayTransactionCount: number
  avgTransactionValue: number
  totalInventoryValuation: number
  lowStockCount: number
  outOfStockCount: number
  approachingExpiryCount: number
  currentShiftActive: boolean
  activeShiftCashier?: string
  activeShiftOpeningTime?: string
  pendingRefundCount: number
  outstandingPoCount: number
}

export interface SalesChartDataPoint {
  date: string
  revenue: number
  profit: number
  transactions: number
}

export interface PaymentMethodBreakdown {
  method: string
  total: number
  percentage: number
  count: number
}

// Generic API response shapes
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
