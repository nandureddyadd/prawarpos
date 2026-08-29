export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  pin?: string;
  active: boolean;
  assignedTables?: string[]; // table IDs
  createdAt: string;
}

export type TableStatus = 'available' | 'occupied' | 'ordering' | 'billing' | 'reserved' | 'cleaning';

export interface Floor {
  id: string;
  name: string;
  order: number;
}

export interface Table {
  id: string;
  number: string;
  floorId: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  assignedWaiterId?: string;
  guestCount?: number;
  customerName?: string;
  customerPhone?: string;
  occupiedSince?: string; // ISO string
  notes?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  order: number;
  itemCount?: number;
}

export interface MenuItemVariant {
  id: string;
  name: string; // e.g. "Half", "Full", "Small", "Large"
  price: number;
}

export interface MenuItemAddon {
  id: string;
  name: string; // e.g. "Extra Cheese", "Extra Egg", "Raita"
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  taxRate?: number; // e.g. 5 for 5%
  prepTimeMinutes?: number;
  shortCode?: string; // e.g. "CB" for Chicken Biryani quick lookup
}

export interface CartItem {
  id: string; // unique cart line item id
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: MenuItemVariant;
  addons?: MenuItemAddon[];
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy';
  instructions?: string;
  isVeg: boolean;
  kotId?: string; // which KOT it belonged to if already sent
  isSentToKot?: boolean;
}

export interface KOTItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  variantName?: string;
  addons?: string[];
  spiceLevel?: string;
  instructions?: string;
  isVeg: boolean;
}

export interface KOT {
  id: string;
  kotNumber: number; // e.g. 1048
  orderId: string;
  tableId: string;
  tableNumber: string;
  floorName: string;
  waiterId: string;
  waiterName: string;
  items: KOTItem[];
  createdAt: string;
  printedAt?: string;
  printStatus: 'printed' | 'failed' | 'queued';
  reprintCount: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: string;
  floorId: string;
  waiterId: string;
  waiterName: string;
  guestCount: number;
  customerName?: string;
  customerPhone?: string;
  status: 'active' | 'billed' | 'completed' | 'cancelled';
  items: CartItem[];
  kotIds: string[];
  createdAt: string;
  updatedAt: string;
  subtotal: number;
}

export interface SplitItemPayment {
  guestName: string;
  itemIds: string[];
  amount: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'split' | 'other';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  cashTendered?: number;
  changeGiven?: number;
  reference?: string; // UPI txn or card last 4
  splitBreakdown?: {
    cash?: number;
    upi?: number;
    card?: number;
  };
}

export interface Bill {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0042"
  orderId: string;
  tableId: string;
  tableNumber: string;
  floorName: string;
  waiterId: string;
  waiterName: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  items: CartItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountAmount: number;
  discountReason?: string;
  cgstRate: number; // e.g. 2.5%
  cgstAmount: number;
  sgstRate: number; // e.g. 2.5%
  sgstAmount: number;
  serviceChargeRate: number; // e.g. 5%
  serviceChargeAmount: number;
  roundOff: number;
  grandTotal: number;
  status: 'unpaid' | 'paid' | 'cancelled' | 'refunded';
  payment?: PaymentDetails;
  createdAt: string;
  paidAt?: string;
  printStatus?: 'printed' | 'failed' | 'queued';
  reprintCount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'packets' | 'cans' | 'bottles';
  unitCost: number;
  supplier?: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'in' | 'waste' | 'adjustment' | 'usage';
  quantity: number;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: 'auth' | 'order' | 'kot' | 'billing' | 'payment' | 'table' | 'menu' | 'inventory' | 'staff' | 'settings';
  details: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'kot' | 'bill' | 'receipt';
  connection: 'network' | 'usb' | 'bluetooth' | 'browser';
  ipAddress?: string;
  paperSize: '58mm' | '80mm';
  copies: number;
  isDefault: boolean;
  status: 'connected' | 'disconnected' | 'error';
  autoPrintKOT: boolean;
  autoPrintBill: boolean;
}

export interface RestaurantSettings {
  name: string;
  legalName?: string;
  tagline?: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  fssaiNumber: string;
  currencySymbol: string;
  currencyCode: string;
  invoicePrefix: string;
  cgstRate: number;
  sgstRate: number;
  serviceChargeRate: number;
  enableServiceCharge: boolean;
  enableRoundOff: boolean;
  soundEffects: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  size: 'sm' | 'md' | 'lg' | 'full';
}

export type Category = MenuCategory;
export type StaffUser = User;
export type ThermalPrinterConfig = PrinterConfig;
