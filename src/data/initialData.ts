import {
  User,
  Floor,
  Table,
  MenuCategory,
  MenuItem,
  Order,
  KOT,
  Bill,
  InventoryItem,
  PrinterConfig,
  RestaurantSettings,
  Branch,
  DashboardWidgetConfig,
  AuditLog,
} from '../types';
import { RESTAURANT_CATEGORIES, RESTAURANT_MENU_ITEMS } from './restaurantMenuData';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Branch',
    code: 'HQ',
    address: '123 Commercial Hub, Main Road',
    phone: '+91 98765 43210',
    isMain: true,
  },
];

export const INITIAL_SETTINGS: RestaurantSettings = {
  name: 'The White Fog',
  legalName: 'The White Fog Cafe & Resto',
  tagline: 'Fresh Flavors, Fast Service',
  address: '123 Commercial Hub, Main Road',
  phone: '+91 98765 43210',
  email: 'contact@thewhitefog.com',
  gstNumber: '29AAAAA0000A1Z5',
  fssaiNumber: '10019043000123',
  currencySymbol: '₹',
  currencyCode: 'INR',
  invoicePrefix: 'INV',
  cgstRate: 2.5,
  sgstRate: 2.5,
  serviceChargeRate: 5.0,
  enableServiceCharge: false,
  enableRoundOff: true,
  soundEffects: true,
  theme: 'light',
};

export const INITIAL_USERS: User[] = [];

// Clean real restaurant structure
export const INITIAL_FLOORS: Floor[] = [
  { id: 'floor-ground', name: 'Ground Floor', order: 1 },
  { id: 'floor-first', name: 'First Floor / Balcony', order: 2 },
];

export const INITIAL_TABLES: Table[] = [
  { id: 't-g1', number: 'T-01', floorId: 'floor-ground', capacity: 2, status: 'available' },
  { id: 't-g2', number: 'T-02', floorId: 'floor-ground', capacity: 4, status: 'available' },
  { id: 't-g3', number: 'T-03', floorId: 'floor-ground', capacity: 4, status: 'available' },
  { id: 't-g4', number: 'T-04', floorId: 'floor-ground', capacity: 6, status: 'available' },
  { id: 't-g5', number: 'T-05', floorId: 'floor-ground', capacity: 8, status: 'available' },
  { id: 't-f1', number: 'B-01', floorId: 'floor-first', capacity: 4, status: 'available' },
  { id: 't-f2', number: 'B-02', floorId: 'floor-first', capacity: 4, status: 'available' },
  { id: 't-f3', number: 'B-03', floorId: 'floor-first', capacity: 6, status: 'available' },
];

export const INITIAL_CATEGORIES: MenuCategory[] = RESTAURANT_CATEGORIES;
export const INITIAL_MENU_ITEMS: MenuItem[] = RESTAURANT_MENU_ITEMS;

export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_KOTS: KOT[] = [];
export const INITIAL_BILLS: Bill[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_PRINTERS: PrinterConfig[] = [
  {
    id: 'printer-kot',
    name: 'Kitchen Thermal Printer',
    type: 'kot',
    paperSize: '80mm',
    connection: 'network',
    ipAddress: '192.168.1.200',
    copies: 1,
    isDefault: true,
    status: 'connected',
    autoPrintKOT: true,
    autoPrintBill: false,
  },
  {
    id: 'printer-bill',
    name: 'Billing Thermal Printer',
    type: 'bill',
    paperSize: '80mm',
    connection: 'usb',
    copies: 1,
    isDefault: true,
    status: 'connected',
    autoPrintKOT: false,
    autoPrintBill: true,
  },
];

export const INITIAL_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'widget-kpis', title: 'Live KPIs', visible: true, order: 1, size: 'full' },
  { id: 'widget-tables', title: 'Live Tables', visible: true, order: 2, size: 'lg' },
  { id: 'widget-hourly', title: 'Hourly Sales', visible: true, order: 3, size: 'md' },
  { id: 'widget-top-items', title: 'Top Items', visible: true, order: 4, size: 'md' },
];
