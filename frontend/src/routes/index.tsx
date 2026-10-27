import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'

// Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { PosPage } from '@/pages/pos/PosPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { CategoriesBrandsPage } from '@/pages/categories/CategoriesBrandsPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { BatchesExpiryPage } from '@/pages/batches/BatchesExpiryPage'
import { StockCountsPage } from '@/pages/stock-adjustments/StockCountsPage'
import { SuppliersPage } from '@/pages/suppliers/SuppliersPage'
import { PurchaseOrdersPage } from '@/pages/purchases/PurchaseOrdersPage'
import { SalesHistoryPage } from '@/pages/sales/SalesHistoryPage'
import { ReturnsRefundsPage } from '@/pages/returns/ReturnsRefundsPage'
import { CustomersLoyaltyPage } from '@/pages/customers/CustomersLoyaltyPage'
import { CashierShiftsPage } from '@/pages/shifts/CashierShiftsPage'
import { ExpensesPage } from '@/pages/expenses/ExpensesPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { PromotionsCouponsPage } from '@/pages/promotions/PromotionsCouponsPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { ActivityLogsPage } from '@/pages/activity/ActivityLogsPage'
import { StoreSettingsPage } from '@/pages/settings/StoreSettingsPage'

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Protected Application Shell (All 20 Single-Supermarket Modules)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'pos',
        element: <PosPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'categories',
        element: <CategoriesBrandsPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'batches',
        element: <BatchesExpiryPage />,
      },
      {
        path: 'stock-counts',
        element: <StockCountsPage />,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'purchases',
        element: <PurchaseOrdersPage />,
      },
      {
        path: 'sales',
        element: <SalesHistoryPage />,
      },
      {
        path: 'returns',
        element: <ReturnsRefundsPage />,
      },
      {
        path: 'customers',
        element: <CustomersLoyaltyPage />,
      },
      {
        path: 'shifts',
        element: <CashierShiftsPage />,
      },
      {
        path: 'expenses',
        element: <ExpensesPage />,
      },
      {
        path: 'employees',
        element: <EmployeesPage />,
      },
      {
        path: 'promotions',
        element: <PromotionsCouponsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'activity-logs',
        element: <ActivityLogsPage />,
      },
      {
        path: 'settings',
        element: <StoreSettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
