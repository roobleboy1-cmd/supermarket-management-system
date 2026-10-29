import { create } from 'zustand'

export type Language = 'so' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: string) => string
}

const STORAGE_KEY = 'supermarket_language_preference'

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  so: {
    // Brand & App
    'app.name': 'SomSupermarket',
    'app.subtitle': 'Dukaanka Dhexe ee Casriga ah',
    'app.singleStore': 'Single Supermarket Central',

    // Navigation Sections
    'section.operations': 'Hawlgallada Dukaanka',
    'section.catalog': 'Kaydka & Alaabta',
    'section.purchasing': 'Iibsiga & Macaamiisha',
    'section.finance': 'Maaliyadda & Maamulka',

    // Nav Items
    'nav.dashboard': 'Guddiga Guud (Dashboard)',
    'nav.pos': 'Goobta Iibka (POS)',
    'nav.sales': 'Iibka & Rasiidhada',
    'nav.returns': 'Celinta & Lacag-celinta',
    'nav.shifts': 'Shift-ka Khasnajiga',
    'nav.products': 'Buugga Alaabta',
    'nav.categories': 'Qaybaha & Noocyada',
    'nav.inventory': 'Kaydka Bakhaarka',
    'nav.batches': 'Taariikhda Dhicitaanka',
    'nav.stockCounts': 'Tirinta & Hagaajinta Stock-ga',
    'nav.suppliers': 'Alaab-qeybiyeyaasha',
    'nav.purchases': 'Dalabaadka Iibsiga (PO)',
    'nav.customers': 'Macaamiisha & Loyalty',
    'nav.promotions': 'Qiimo-dhimista & Kuubannada',
    'nav.expenses': 'Kharashaadka Dukaanka',
    'nav.reports': 'Warbixinada & Xisaabaadka',
    'nav.employees': 'Shaqaalaha & Ogolaanshaha',
    'nav.notifications': 'Ogeysiisyada',
    'nav.activityLogs': 'Diiwaanka Hawlaha',
    'nav.settings': 'Habaynta Dukaanka',

    // Header Controls
    'header.search': 'Raadi alaab, rasiidh, macaamiil... (Ctrl+K)',
    'header.searchShort': 'Raadi...',
    'header.openPos': 'Fur POS',
    'header.shiftActive': 'Shift: Furan',
    'header.shiftClosed': 'Shift: Xiran',
    'header.online': 'Khadka',
    'header.offline': 'Offline',
    'header.sync': 'Sync',
    'header.role': 'Doorka',
    'header.switchRole': 'Beddel Doorka',
    'header.themeLight': 'Iftiinka',
    'header.themeDark': 'Madowga',
    'header.themeSystem': 'Nidaamka',
    'header.signOut': 'Ka Bax',
    'header.language': 'Luuqadda',
    'header.langSomali': 'Soomaali',
    'header.langEnglish': 'English',
    'header.myAccount': 'Koontada Shaqaalaha',
    'header.storeSettings': 'Habaynta Guud',
    'header.activityLogs': 'Diiwaanka Shaqadaada',

    // Roles
    'role.superAdmin': 'Maamulaha Sare',
    'role.manager': 'Maamulaha Hawlgalka',
    'role.cashier': 'Khasnaji (POS)',
    'role.inventoryManager': 'Maamulaha Bakhaarka',
    'role.accountant': 'Xisaabiye Guud',
    'role.auditor': 'Hanti-dhowre',

    // Role Descriptions
    'roleDesc.superAdmin': 'Dhammaan shaqooyinka nidaamka, settings-ka & shaqaalaha',
    'roleDesc.manager': 'Iibka, stock-ga, fasaxa celinta & warbixinada dukaanka',
    'roleDesc.cashier': 'Kaliya Point of Sale (POS), rasiidhada & shift-ka lacagta',
    'roleDesc.inventoryManager': 'Kaliya kaydka alaabta, batches & dalabaadka alaab-qeybiyaha',
    'roleDesc.accountant': 'Kaliya kharashaadka, xisaabaadka iibka & faa\'iidada (P&L)',
    'roleDesc.auditor': 'Kaliya baarista stock-ga, xisaab xaqiijinta & logs-ka hawlaha',

    // Common Actions
    'action.save': 'Keydi',
    'action.cancel': 'Jooji',
    'action.add': 'Ku Dar',
    'action.delete': 'Tirtir',
    'action.edit': 'Wax Ka Beddel',
    'action.export': 'Soo Deji CSV',
    'action.print': 'Daabac Rasiidh',
    'action.filter': 'Kala Shaandhee',
    'action.search': 'Raadi',
    'action.refresh': 'Cusbooneysii',
    'action.viewAll': 'Eeg Dhammaan',
    'action.close': 'Xir',
    'action.submit': 'Gudbi',
    'action.apply': 'Codso',
    'action.clear': 'Nadiifi',
    'action.back': 'Dib u Noqo',

    // Dashboard
    'dash.title': 'Guddiga Maamulka ee Supermarket-ka',
    'dash.subtitle': 'Xogta tooska ah ee iibka maanta, faa\'iidada, kaydka, iyo dhaqdhaqaaqa shaqaalaha',
    'dash.todaySales': 'Iibka Maanta',
    'dash.grossProfit': 'Faa\'iidada Guud',
    'dash.transactions': 'Tirada Iibka',
    'dash.avgBasket': 'Celceliska Iibka',
    'dash.inventoryVal': 'Qiimaha Kaydka',
    'dash.lowStock': 'Alaabta Dhamaanaysa',
    'dash.nearExpiry': 'Dhicitaanka Dhow',
    'dash.activeShift': 'Xaaladda Shift-ka',
    'dash.recentSales': 'Iibkii Ugu Dambeeyay',
    'dash.topProducts': 'Alaabta Ugu Iibka Badan',
    'dash.salesByMethod': 'Hababka Lacag-bixinta',
    'dash.quickActions': 'Ficillada Degdegga ah',
    'dash.newSale': 'Iib Cusub (POS)',
    'dash.addProduct': 'Ku Dar Alaab Cusub',
    'dash.recordExpense': 'Qor Kharash',
    'dash.adjustStock': 'Hagaaji Kaydka',
    'dash.viewReports': 'Warbixinta Maaliyadda',
    'dash.pendingRefunds': 'Celinta Sugaysa Fasax',
    'dash.outOfStock': 'Alaabta Go\'day',
    'dash.salesTrend': 'Jadwalka Iibka Maalmaha',

    // POS
    'pos.scanBarcode': 'Scan garee ama qor barcode-ka...',
    'pos.searchProduct': 'Raadi magac, SKU, qayb...',
    'pos.cart': 'Gaariga Iibsiga',
    'pos.itemsInCart': 'alaab ayaa ku jirta',
    'pos.clearCart': 'Faaruqi Gaariga',
    'pos.holdSale': 'Hakad Geli',
    'pos.resumeSale': 'Soo Celi',
    'pos.subtotal': 'Isu-geynta Hoose',
    'pos.discount': 'Qiimo-dhimis',
    'pos.tax': 'Canshuur',
    'pos.total': 'Isu-geynta Guud',
    'pos.payNow': 'Bixi Lacagta',
    'pos.cashReceived': 'Lacagta la Dhiibay',
    'pos.changeDue': 'Lacagta Lagu Leeyahay',
    'pos.paymentMethod': 'Habka Lacag-bixinta',
    'pos.splitPayment': 'Kala Qeybi Lacagta',
    'pos.complete': 'Dhameystir Iibka',
    'pos.customer': 'Macaamiilka',
    'pos.selectCustomer': 'Dooro Macaamiil...',

    // Banner / Role Guards
    'guard.restrictedTitle': 'Qaybtan Shaqadaada Kuma Jirto',
    'guard.restrictedDesc': 'Adigu waxaad ku jirtaa doorka kor ku xusan. Qaybtan waxa loo qoondeeyay doorka shaqada ku haboon.',
    'guard.yourScope': 'Shaqada laguu qoondeeyay:',
    'guard.goBack': 'Ku Noqo Shaqadaada',
    'guard.switchToAdmin': 'U Beddel Super Admin',
  },
  en: {
    // Brand & App
    'app.name': 'SomSupermarket',
    'app.subtitle': 'Modern Central Supermarket',
    'app.singleStore': 'Single Supermarket Central',

    // Navigation Sections
    'section.operations': 'Store Operations',
    'section.catalog': 'Catalog & Inventory',
    'section.purchasing': 'Purchasing & CRM',
    'section.finance': 'Finance & Administration',

    // Nav Items
    'nav.dashboard': 'Dashboard',
    'nav.pos': 'Point of Sale (POS)',
    'nav.sales': 'Sales & Transactions',
    'nav.returns': 'Returns & Refunds',
    'nav.shifts': 'Cashier Shifts',
    'nav.products': 'Products Catalog',
    'nav.categories': 'Categories & Brands',
    'nav.inventory': 'Store Inventory',
    'nav.batches': 'Batches & Expiry Dates',
    'nav.stockCounts': 'Stock Adjustments & Counts',
    'nav.suppliers': 'Suppliers Directory',
    'nav.purchases': 'Purchase Orders (PO)',
    'nav.customers': 'Customers & Loyalty',
    'nav.promotions': 'Promotions & Coupons',
    'nav.expenses': 'Store Expenses',
    'nav.reports': 'Reports & Analytics',
    'nav.employees': 'Employees & Access',
    'nav.notifications': 'Notifications',
    'nav.activityLogs': 'Activity Logs',
    'nav.settings': 'Store Settings',

    // Header Controls
    'header.search': 'Search products, invoices, customers... (Ctrl+K)',
    'header.searchShort': 'Search...',
    'header.openPos': 'Open POS',
    'header.shiftActive': 'Shift: Active',
    'header.shiftClosed': 'Shift: Closed',
    'header.online': 'Online',
    'header.offline': 'Offline',
    'header.sync': 'Sync',
    'header.role': 'Role',
    'header.switchRole': 'Switch Role',
    'header.themeLight': 'Light Mode',
    'header.themeDark': 'Dark Mode',
    'header.themeSystem': 'System',
    'header.signOut': 'Sign Out',
    'header.language': 'Language',
    'header.langSomali': 'Soomaali',
    'header.langEnglish': 'English',
    'header.myAccount': 'Staff Account',
    'header.storeSettings': 'Store Settings',
    'header.activityLogs': 'My Activity Logs',

    // Roles
    'role.superAdmin': 'Super Admin',
    'role.manager': 'Manager',
    'role.cashier': 'Cashier',
    'role.inventoryManager': 'Inventory Manager',
    'role.accountant': 'Accountant',
    'role.auditor': 'Auditor',

    // Role Descriptions
    'roleDesc.superAdmin': 'Full administrative control, store settings & employee security',
    'roleDesc.manager': 'Store sales oversight, inventory approvals & financial reports',
    'roleDesc.cashier': 'Point of Sale (POS), customer checkouts, shifts & receipts',
    'roleDesc.inventoryManager': 'Stock catalog, batch expiry tracking & supplier orders',
    'roleDesc.accountant': 'Financial accounting, operating expenses & profit/loss statements',
    'roleDesc.auditor': 'Physical stock audits, audit trail verification & compliance logs',

    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.add': 'Add New',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.export': 'Export CSV',
    'action.print': 'Print Receipt',
    'action.filter': 'Filter',
    'action.search': 'Search',
    'action.refresh': 'Refresh',
    'action.viewAll': 'View All',
    'action.close': 'Close',
    'action.submit': 'Submit',
    'action.apply': 'Apply',
    'action.clear': 'Clear',
    'action.back': 'Go Back',

    // Dashboard
    'dash.title': 'Supermarket Management Dashboard',
    'dash.subtitle': 'Real-time overview of single-store sales, gross margins, inventory valuation and staff operations',
    'dash.todaySales': "Today's Sales",
    'dash.grossProfit': 'Gross Profit',
    'dash.transactions': 'Transactions Count',
    'dash.avgBasket': 'Avg. Transaction Value',
    'dash.inventoryVal': 'Total Inventory Value',
    'dash.lowStock': 'Low Stock Alert',
    'dash.nearExpiry': 'Expiring Soon',
    'dash.activeShift': 'Active Shift Status',
    'dash.recentSales': 'Recent Transactions',
    'dash.topProducts': 'Top Selling Products',
    'dash.salesByMethod': 'Sales by Payment Method',
    'dash.quickActions': 'Quick Actions',
    'dash.newSale': 'New Sale (POS)',
    'dash.addProduct': 'Add Product',
    'dash.recordExpense': 'Record Expense',
    'dash.adjustStock': 'Adjust Stock',
    'dash.viewReports': 'Financial Reports',
    'dash.pendingRefunds': 'Pending Refund Approvals',
    'dash.outOfStock': 'Out of Stock',
    'dash.salesTrend': 'Sales Revenue Trend',

    // POS
    'pos.scanBarcode': 'Scan or enter barcode (F2)...',
    'pos.searchProduct': 'Search product name, SKU, category...',
    'pos.cart': 'Active Cart',
    'pos.itemsInCart': 'items in cart',
    'pos.clearCart': 'Clear Cart',
    'pos.holdSale': 'Hold Sale',
    'pos.resumeSale': 'Resume Sale',
    'pos.subtotal': 'Subtotal',
    'pos.discount': 'Discount',
    'pos.tax': 'Tax',
    'pos.total': 'Total Due',
    'pos.payNow': 'Pay Now',
    'pos.cashReceived': 'Cash Received',
    'pos.changeDue': 'Change Due',
    'pos.paymentMethod': 'Payment Method',
    'pos.splitPayment': 'Split Payment',
    'pos.complete': 'Complete Transaction',
    'pos.customer': 'Customer',
    'pos.selectCustomer': 'Select Customer...',

    // Banner / Role Guards
    'guard.restrictedTitle': 'Access Restricted to Your Assigned Role',
    'guard.restrictedDesc': 'You are currently assigned to the role above. This section requires higher permissions.',
    'guard.yourScope': 'Your authorized responsibility:',
    'guard.goBack': 'Go to Your Workspace',
    'guard.switchToAdmin': 'Switch to Super Admin',
  },
}

export const useLanguageStore = create<LanguageState>((set, get) => {
  const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Language | null
  const initialLang: Language = saved === 'en' ? 'en' : 'so'

  return {
    language: initialLang,

    setLanguage: (lang: Language) => {
      localStorage.setItem(STORAGE_KEY, lang)
      set({ language: lang })
    },

    toggleLanguage: () => {
      const nextLang: Language = get().language === 'so' ? 'en' : 'so'
      localStorage.setItem(STORAGE_KEY, nextLang)
      set({ language: nextLang })
    },

    t: (key: string): string => {
      const current = get().language
      return TRANSLATIONS[current]?.[key] || TRANSLATIONS['en']?.[key] || key
    },
  }
})
