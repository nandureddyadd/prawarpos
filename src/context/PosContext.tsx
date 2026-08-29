import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  Floor,
  Table,
  MenuCategory,
  MenuItem,
  Order,
  CartItem,
  KOT,
  Bill,
  InventoryItem,
  PrinterConfig,
  RestaurantSettings,
  Branch,
  DashboardWidgetConfig,
  AuditLog,
  TableStatus,
  PaymentDetails,
  UserRole,
} from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_FLOORS,
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_KOTS,
  INITIAL_BILLS,
  INITIAL_INVENTORY,
  INITIAL_PRINTERS,
  INITIAL_DASHBOARD_WIDGETS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { supabase, isSupabaseConfigured, Session, SupabaseAuthUser } from '../lib/supabase';
import { sounds } from '../utils/audio';

interface PrintDocState {
  type: 'kot' | 'bill' | 'receipt' | 'test';
  data: KOT | Bill | { title: string; body: string };
  isReprint?: boolean;
}

export interface PosContextType {
  // Supabase Authentication & Session
  currentUser: User | null;
  authSession: Session | null;
  authLoading: boolean;
  authError: string | null;
  isSupabaseActive: boolean;

  currentBranch: Branch;
  isOnline: boolean;
  selectedFloorId: string; // 'all' or specific floor id
  activePrintDoc: PrintDocState | null;

  // Data collections
  staff: User[];
  branches: Branch[];
  floors: Floor[];
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  kots: KOT[];
  bills: Bill[];
  inventory: InventoryItem[];
  printers: PrinterConfig[];
  settings: RestaurantSettings;
  dashboardWidgets: DashboardWidgetConfig[];
  auditLogs: AuditLog[];

  // Aliases for component convenience
  printJob?: any;
  setPrintJob?: (job: any) => void;
  addStaffMember?: (staff: any) => void;
  updateStaffMember?: (id: string, updates: any) => void;
  deleteStaffMember?: (id: string) => void;
  addInventoryAdjustment?: (itemId: string, delta: number, type: any, reason?: string) => void;
  updateInventoryStock?: (itemId: string, delta: number, type: any, reason?: string) => void;

  // Supabase Auth Methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string, restaurantName: string) => Promise<{ success: boolean; error?: string; requireEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Session & Global controls
  setCurrentUser: (user: User | null) => void;
  setCurrentBranch: (branch: Branch) => void;
  setSelectedFloorId: (floorId: string) => void;
  setIsOnline: (online: boolean) => void;
  setActivePrintDoc: (doc: PrintDocState | null) => void;
  switchUserById: (userId: string) => boolean;
  logout: () => void;

  // Order & KOT Operations
  getTableOrder: (tableId: string) => Order | undefined;
  getTableKots: (tableId: string) => KOT[];
  saveDraftOrder: (tableId: string, items: CartItem[], guestCount?: number, customerName?: string, customerPhone?: string) => Order;
  updateOrderItem: (tableId: string, updatedItem: CartItem) => void;
  removeOrderItem: (tableId: string, itemId: string) => void;
  updateOrderItemQuantity: (tableId: string, itemId: string, delta: number) => void;
  sendKot: (tableId: string, newItems: CartItem[], notes?: string) => Promise<{ kot: KOT; printSuccess: boolean }>;
  reprintKot: (kotId: string) => void;
  cancelKot: (kotId: string, reason: string) => void;

  // Floor Operations
  addFloor: (name: string) => Floor;
  updateFloor: (floor: Floor) => void;
  deleteFloor: (floorId: string) => void;
  deleteTable: (tableId: string) => void;

  // Table Operations
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  transferTable: (sourceTableId: string, targetTableId: string) => boolean;
  mergeTables: (sourceTableIds: string[], targetTableId: string) => boolean;
  addTable: (table: Omit<Table, 'id'>) => Table;
  updateTable: (table: Table) => void;

  // Billing & Payment
  generateBill: (
    tableId: string,
    discountType?: 'percentage' | 'fixed' | 'none',
    discountValue?: number,
    discountReason?: string,
    customerGstin?: string
  ) => Bill;
  settlePayment: (billId: string, payment: PaymentDetails) => boolean;
  saveAndCompleteBill: (billId: string) => boolean;
  reprintBill: (billId: string) => void;

  // Menu Operations
  toggleItemAvailability: (itemId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  addCategory: (name: string) => MenuCategory;
  updateCategory: (category: MenuCategory) => void;
  deleteCategory: (categoryId: string) => void;

  // Inventory Operations
  adjustInventoryStock: (itemId: string, changeQty: number, type: 'in' | 'waste' | 'adjustment', reason?: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;

  // Staff Operations
  addStaff: (staff: Omit<User, 'id' | 'createdAt'>) => void;
  updateStaff: (staff: User) => void;
  deleteStaff: (userId: string) => void;

  // Settings & Widgets
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;
  updateDashboardWidgets: (widgets: DashboardWidgetConfig[]) => void;
  updatePrinters: (printers: PrinterConfig[]) => void;
  testPrint: (printerId: string) => void;

  // Reset demo / clean state
  resetAllData: () => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

const CURRENT_DATA_VERSION = 'v6_supabase_production_auth_strict';

const STORAGE_KEYS = {
  VERSION: 'prawar_data_version',
  BRANCH: 'prawar_pos_branch',
  TABLES: 'prawar_pos_tables',
  MENU_ITEMS: 'prawar_pos_menu_items',
  CATEGORIES: 'prawar_pos_categories',
  ORDERS: 'prawar_pos_orders',
  KOTS: 'prawar_pos_kots',
  BILLS: 'prawar_pos_bills',
  INVENTORY: 'prawar_pos_inventory',
  PRINTERS: 'prawar_pos_printers',
  SETTINGS: 'prawar_pos_settings',
  WIDGETS: 'prawar_pos_widgets',
  AUDIT: 'prawar_pos_audit',
  STAFF: 'prawar_pos_staff',
  FLOORS: 'prawar_pos_floors',
};

// Check version and purge legacy fake data
function checkAndPurgeLegacyData() {
  try {
    const savedVer = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (savedVer !== CURRENT_DATA_VERSION) {
      // Clear out legacy mock data
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('prawar_pos_user');
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_DATA_VERSION);
    }
  } catch (e) {
    // Ignore storage restrictions
  }
}

checkAndPurgeLegacyData();

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded fallback
  }
}

export const PosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State — Starts with NO user until Supabase reports valid session
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core POS State
  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(() =>
    loadStorage(STORAGE_KEYS.BRANCH, INITIAL_BRANCHES[0])
  );

  const [staff, setStaff] = useState<User[]>(() =>
    loadStorage(STORAGE_KEYS.STAFF, INITIAL_USERS)
  );

  const [floors, setFloors] = useState<Floor[]>(() =>
    loadStorage(STORAGE_KEYS.FLOORS, INITIAL_FLOORS)
  );

  const [tables, setTables] = useState<Table[]>(() =>
    loadStorage(STORAGE_KEYS.TABLES, INITIAL_TABLES)
  );

  const [categories, setCategories] = useState<MenuCategory[]>(() =>
    loadStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    loadStorage(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS)
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );

  const [kots, setKots] = useState<KOT[]>(() =>
    loadStorage(STORAGE_KEYS.KOTS, INITIAL_KOTS)
  );

  const [bills, setBills] = useState<Bill[]>(() =>
    loadStorage(STORAGE_KEYS.BILLS, INITIAL_BILLS)
  );

  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadStorage(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY)
  );

  const [printers, setPrinters] = useState<PrinterConfig[]>(() =>
    loadStorage(STORAGE_KEYS.PRINTERS, INITIAL_PRINTERS)
  );

  const [settings, setSettings] = useState<RestaurantSettings>(() =>
    loadStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetConfig[]>(() =>
    loadStorage(STORAGE_KEYS.WIDGETS, INITIAL_DASHBOARD_WIDGETS)
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS)
  );

  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activePrintDoc, setActivePrintDoc] = useState<PrintDocState | null>(null);

  // Sync settings with audio engine
  useEffect(() => {
    sounds.setEnabled(settings.soundEffects ?? true);
  }, [settings.soundEffects]);

  // Persist local store
  useEffect(() => saveStorage(STORAGE_KEYS.BRANCH, currentBranch), [currentBranch]);
  useEffect(() => saveStorage(STORAGE_KEYS.STAFF, staff), [staff]);
  useEffect(() => saveStorage(STORAGE_KEYS.FLOORS, floors), [floors]);
  useEffect(() => saveStorage(STORAGE_KEYS.TABLES, tables), [tables]);
  useEffect(() => saveStorage(STORAGE_KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveStorage(STORAGE_KEYS.MENU_ITEMS, menuItems), [menuItems]);
  useEffect(() => saveStorage(STORAGE_KEYS.ORDERS, orders), [orders]);
  useEffect(() => saveStorage(STORAGE_KEYS.KOTS, kots), [kots]);
  useEffect(() => saveStorage(STORAGE_KEYS.BILLS, bills), [bills]);
  useEffect(() => saveStorage(STORAGE_KEYS.INVENTORY, inventory), [inventory]);
  useEffect(() => saveStorage(STORAGE_KEYS.PRINTERS, printers), [printers]);
  useEffect(() => saveStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.WIDGETS, dashboardWidgets), [dashboardWidgets]);
  useEffect(() => saveStorage(STORAGE_KEYS.AUDIT, auditLogs), [auditLogs]);

  // Helper to log audit
  const logAudit = useCallback((
    action: string,
    category: AuditLog['category'],
    details: string,
    meta?: Record<string, unknown>
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || ('owner' as UserRole),
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
      meta,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 200)]);
  }, [currentUser]);

  // Load user profile & restaurant membership from Supabase
  const loadUserProfile = useCallback(async (sbUser: SupabaseAuthUser): Promise<User | null> => {
    try {
      // 1. Try querying restaurant_members table
      let userRole: UserRole = 'owner';
      let userName = sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Staff';
      let userPhone = sbUser.user_metadata?.phone;
      let userActive = true;
      let userPin = '1234';

      if (isSupabaseConfigured) {
        try {
          const { data: memberData, error: memberError } = await supabase
            .from('restaurant_members')
            .select('*, restaurants(*)')
            .eq('user_id', sbUser.id)
            .maybeSingle();

          if (!memberError && memberData) {
            if (memberData.active === false) {
              // User has been disabled by manager/owner
              await supabase.auth.signOut();
              setCurrentUser(null);
              setAuthError('Your account has been disabled. Please contact your restaurant manager.');
              return null;
            }

            userRole = (memberData.role as UserRole) || 'waiter';
            userPin = memberData.pin || '1234';
            userActive = memberData.active !== false;

            if (memberData.restaurants?.name) {
              setSettings(prev => ({
                ...prev,
                name: memberData.restaurants.name,
                legalName: memberData.restaurants.legal_name || prev.legalName,
                address: memberData.restaurants.address || prev.address,
                phone: memberData.restaurants.phone || prev.phone,
                email: memberData.restaurants.email || prev.email,
                 gstNumber: memberData.restaurants.gst_number || prev.gstNumber,
                 fssaiNumber: memberData.restaurants.fssai_number || prev.fssaiNumber,
                 currencySymbol: memberData.restaurants.currency_symbol || prev.currencySymbol,
                 currencyCode: memberData.restaurants.currency_code || prev.currencyCode,
                 invoicePrefix: memberData.restaurants.invoice_prefix || prev.invoicePrefix,
                 cgstRate: Number(memberData.restaurants.cgst_rate ?? prev.cgstRate),
                 sgstRate: Number(memberData.restaurants.sgst_rate ?? prev.sgstRate),
                 serviceChargeRate: Number(memberData.restaurants.service_charge_rate ?? prev.serviceChargeRate),
                 enableServiceCharge: memberData.restaurants.enable_service_charge ?? prev.enableServiceCharge,
                 enableRoundOff: memberData.restaurants.enable_round_off ?? prev.enableRoundOff,
                 logo: memberData.restaurants.logo_url || prev.logo,
              }));
            }
          }

          // Also check profiles table for updated name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .maybeSingle();

          if (profileData?.name) {
            userName = profileData.name;
          }
          if (profileData?.phone) {
            userPhone = profileData.phone;
          }
        } catch (dbErr) {
          console.warn('Supabase DB table query fallback to user metadata:', dbErr);
        }
      }

      // Check user metadata if DB didn't provide specific override
      if (sbUser.user_metadata?.role) {
        userRole = sbUser.user_metadata.role as UserRole;
      }
      if (sbUser.user_metadata?.name) {
        userName = sbUser.user_metadata.name;
      }

      const activeUser: User = {
        id: sbUser.id,
        name: userName,
        email: sbUser.email || '',
        role: userRole,
        pin: userPin,
        phone: userPhone,
        active: userActive,
        createdAt: sbUser.created_at || new Date().toISOString(),
      };

      setCurrentUser(activeUser);

      // Add to local staff list if not already present
      setStaff(prev => {
        const exists = prev.some(s => s.id === activeUser.id || s.email === activeUser.email);
        if (!exists) {
          return [activeUser, ...prev];
        }
        return prev.map(s => (s.id === activeUser.id || s.email === activeUser.email ? activeUser : s));
      });

      return activeUser;
    } catch (err) {
      console.error('Error loading Supabase user profile:', err);
      return null;
    }
  }, []);

  // Supabase Auth Session Initialization & Event Listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setAuthLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session load error:', error);
          if (isMounted) setAuthError(error.message);
        }

        if (session?.user && isMounted) {
          setAuthSession(session);
          await loadUserProfile(session.user);
        } else if (isMounted) {
          setAuthSession(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Exception checking Supabase auth:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    initAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setAuthSession(session);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAuthSession(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Supabase Sign In with Email and Password
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      const msg = 'Please enter both your email address and password.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let friendlyMessage = 'Invalid email or password.';
        const errLower = error.message.toLowerCase();

        if (errLower.includes('email not confirmed') || errLower.includes('not verified')) {
          friendlyMessage = 'Please verify your email address before signing in.';
        } else if (errLower.includes('invalid login credentials') || errLower.includes('invalid credentials')) {
          friendlyMessage = 'Invalid email or password.';
        } else if (errLower.includes('network') || errLower.includes('failed to fetch')) {
          friendlyMessage = 'Unable to connect. Please check your internet connection and try again.';
        } else if (errLower.includes('disabled') || errLower.includes('banned')) {
          friendlyMessage = 'Your account has been disabled. Please contact your restaurant manager.';
        } else {
          friendlyMessage = error.message;
        }

        setAuthError(friendlyMessage);
        sounds.playAlert();
        return { success: false, error: friendlyMessage };
      }

      if (data?.user) {
        setAuthSession(data.session);
        const profile = await loadUserProfile(data.user);

        if (!profile) {
          return { success: false, error: 'Your account has been disabled. Please contact your restaurant manager.' };
        }

        sounds.playPaymentSuccess();
        logAudit('User Signed In', 'auth', `${profile.name} (${profile.email}) logged into POS station.`);
        return { success: true };
      }

      return { success: false, error: 'Authentication failed. Please try again.' };
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect. Please check your internet connection and try again.';
      setAuthError(msg);
      sounds.playAlert();
      return { success: false, error: msg };
    }
  }, [loadUserProfile, logAudit]);

  // Supabase Sign Up (Restaurant Owner & Restaurant Setup)
  const signUp = useCallback(async (
    name: string,
    email: string,
    password: string,
    restaurantName: string
  ): Promise<{ success: boolean; error?: string; requireEmailVerification?: boolean }> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanRestName = restaurantName.trim();

    if (!cleanEmail || !password || !cleanName || !cleanRestName) {
      const msg = 'Please fill in all required fields.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            restaurant_name: cleanRestName,
            role: 'owner',
          },
        },
      });

      if (error) {
        let friendlyMessage = error.message;
        const errLower = error.message.toLowerCase();
        if (errLower.includes('user already registered') || errLower.includes('already exists')) {
          friendlyMessage = 'An account with this email address already exists. Please sign in instead.';
        } else if (errLower.includes('network') || errLower.includes('failed to fetch')) {
          friendlyMessage = 'Unable to connect. Please check your internet connection and try again.';
        }
        setAuthError(friendlyMessage);
        sounds.playAlert();
        return { success: false, error: friendlyMessage };
      }

      // Update restaurant settings locally
      setSettings(prev => ({
        ...prev,
        name: cleanRestName,
        email: cleanEmail,
      }));

      // If user session is returned immediately (email confirmation disabled in Supabase)
      if (data?.session && data?.user) {
        setAuthSession(data.session);
        await loadUserProfile(data.user);
        sounds.playPaymentSuccess();
        return { success: true, requireEmailVerification: false };
      }

      // If email confirmation is required
      return { success: true, requireEmailVerification: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account. Please try again.';
      setAuthError(msg);
      sounds.playAlert();
      return { success: false, error: msg };
    }
  }, [loadUserProfile]);

  // Supabase Sign Out
  const signOut = useCallback(async () => {
    try {
      if (currentUser) {
        logAudit('User Signed Out', 'auth', `${currentUser.name} logged out.`);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      setCurrentUser(null);
      setAuthSession(null);
      setAuthError(null);
      sounds.playTap();
    }
  }, [currentUser, logAudit]);

  // Supabase Forgot Password Request
  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unable to send password reset email.' };
    }
  }, []);

  // Supabase Update User Password
  const updateUserPassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  }, []);

  // Resend Email Verification
  const resendVerificationEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend confirmation email.' };
    }
  }, []);

  // Staff Account Switcher (For active restaurant session)
  const switchUserById = useCallback((userId: string): boolean => {
    const user = staff.find(u => u.id === userId && u.active);
    if (user) {
      setCurrentUser(user);
      logAudit('User Switched', 'auth', `Switched active station user to ${user.name} (${user.role.toUpperCase()})`);
      return true;
    }
    return false;
  }, [staff, logAudit]);

  const logout = useCallback(() => {
    signOut();
  }, [signOut]);


  // Floor Operations
  const addFloor = useCallback((name: string): Floor => {
    const newFloor: Floor = {
      id: `floor-${Date.now()}`,
      name: name.trim(),
      order: floors.length + 1,
    };
    setFloors(prev => [...prev, newFloor]);
    logAudit('Floor Created', 'table', `Created floor "${newFloor.name}"`);
    return newFloor;
  }, [floors.length, logAudit]);

  const updateFloor = useCallback((updated: Floor) => {
    setFloors(prev => prev.map(f => f.id === updated.id ? updated : f));
    logAudit('Floor Updated', 'table', `Updated floor "${updated.name}"`);
  }, [logAudit]);

  const deleteFloor = useCallback((floorId: string) => {
    const f = floors.find(fl => fl.id === floorId);
    setFloors(prev => prev.filter(fl => fl.id !== floorId));
    // Also delete or reassign tables on this floor
    setTables(prev => prev.filter(t => t.floorId !== floorId));
    logAudit('Floor Deleted', 'table', `Deleted floor "${f?.name || floorId}" and its tables`);
  }, [floors, logAudit]);

  // Table Operations
  const addTable = useCallback((newTable: Omit<Table, 'id'>): Table => {
    const created: Table = {
      ...newTable,
      id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      status: newTable.status || 'available',
    };
    setTables(prev => [...prev, created]);
    logAudit('Table Created', 'table', `Added table "${created.number}" (Capacity: ${created.capacity})`);
    return created;
  }, [logAudit]);

  const updateTable = useCallback((updated: Table) => {
    setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
    logAudit('Table Updated', 'table', `Updated table "${updated.number}"`);
  }, [logAudit]);

  const deleteTable = useCallback((tableId: string) => {
    const t = tables.find(tb => tb.id === tableId);
    setTables(prev => prev.filter(tb => tb.id !== tableId));
    logAudit('Table Deleted', 'table', `Deleted table "${t?.number || tableId}"`);
  }, [tables, logAudit]);

  // Orders & KOT Helpers
  const getTableOrder = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return undefined;
    return orders.find(o => o.id === table.currentOrderId);
  }, [tables, orders]);

  const getTableKots = useCallback((tableId: string) => {
    return kots.filter(k => k.tableId === tableId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [kots]);

  // Save or update draft order
  const saveDraftOrder = useCallback((
    tableId: string,
    items: CartItem[],
    guestCount: number = 2,
    customerName?: string,
    customerPhone?: string
  ): Order => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const now = new Date().toISOString();

    if (existingOrder) {
      const updatedOrder: Order = {
        ...existingOrder,
        items,
        subtotal,
        guestCount: guestCount || existingOrder.guestCount,
        customerName: customerName ?? existingOrder.customerName,
        customerPhone: customerPhone ?? existingOrder.customerPhone,
        updatedAt: now,
      };
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      return updatedOrder;
    } else {
      const newOrderNum = 1000 + orders.length + 1;
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: newOrderNum,
        tableId,
        tableNumber: table?.number || 'T-??',
        floorId: table?.floorId || 'floor-ground',
        waiterId: currentUser?.id || 'waiter-1',
        waiterName: currentUser?.name || 'Staff',
        guestCount: guestCount || 2,
        customerName,
        customerPhone,
        status: 'active',
        items,
        kotIds: [],
        createdAt: now,
        updatedAt: now,
        subtotal,
      };

      setOrders(prev => [newOrder, ...prev]);

      // Update table status
      setTables(prev => prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'occupied',
            currentOrderId: newOrder.id,
            assignedWaiterId: currentUser?.id || t.assignedWaiterId,
            guestCount: guestCount || t.guestCount || 2,
            customerName: customerName || t.customerName,
            customerPhone: customerPhone || t.customerPhone,
            occupiedSince: t.occupiedSince || now,
          };
        }
        return t;
      }));

      return newOrder;
    }
  }, [tables, orders, currentUser]);

  // Update specific order line item (edit quantity, customization, price, notes)
  const updateOrderItem = useCallback((tableId: string, updatedItem: CartItem) => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    if (!existingOrder) return;

    const now = new Date().toISOString();
    const updatedItems = existingOrder.items.map(it => it.id === updatedItem.id ? updatedItem : it);
    const subtotal = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedOrder: Order = {
      ...existingOrder,
      items: updatedItems,
      subtotal,
      updatedAt: now,
    };

    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // Also synchronize any active unpaid bill for this table immediately
    setBills(prev => prev.map(b => {
      if (b.tableId === tableId && b.status === 'unpaid') {
        const billItems = b.items.map(it => it.id === updatedItem.id ? updatedItem : it);
        const billSubtotal = billItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        let billDiscountAmount = 0;
        if (b.discountType === 'percentage') {
          billDiscountAmount = Math.round(((billSubtotal * b.discountValue) / 100) * 100) / 100;
        } else if (b.discountType === 'fixed') {
          billDiscountAmount = Math.min(billSubtotal, b.discountValue);
        }
        const billTaxable = Math.max(0, billSubtotal - billDiscountAmount);
        const billCgst = (billTaxable * b.cgstRate) / 100;
        const billSgst = (billTaxable * b.sgstRate) / 100;
        const billServiceCharge = b.serviceChargeRate > 0 ? (billTaxable * b.serviceChargeRate) / 100 : 0;
        const raw = billTaxable + billCgst + billSgst + billServiceCharge;
        const grand = settings.enableRoundOff ? Math.round(raw) : Math.round(raw * 100) / 100;
        const roundOff = settings.enableRoundOff ? Math.round((grand - raw) * 100) / 100 : 0;

        return {
          ...b,
          items: billItems,
          subtotal: billSubtotal,
          discountAmount: billDiscountAmount,
          cgstAmount: billCgst,
          sgstAmount: billSgst,
          serviceChargeAmount: billServiceCharge,
          roundOff,
          grandTotal: grand,
        };
      }
      return b;
    }));

    sounds.playTap();
    logAudit(
      'Order Item Updated',
      'order',
      `Updated ${updatedItem.name} (Qty: ${updatedItem.quantity}, Price: ₹${updatedItem.price}) for Table ${table?.number}`
    );
  }, [tables, orders, settings, logAudit]);

  // Remove specific order line item
  const removeOrderItem = useCallback((tableId: string, itemId: string) => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    if (!existingOrder) return;

    const now = new Date().toISOString();
    const updatedItems = existingOrder.items.filter(it => it.id !== itemId);
    const subtotal = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedOrder: Order = {
      ...existingOrder,
      items: updatedItems,
      subtotal,
      updatedAt: now,
    };

    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // Also update any active unpaid bill
    setBills(prev => prev.map(b => {
      if (b.tableId === tableId && b.status === 'unpaid') {
        const billItems = b.items.filter(it => it.id !== itemId);
        const billSubtotal = billItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        let billDiscountAmount = 0;
        if (b.discountType === 'percentage') {
          billDiscountAmount = Math.round(((billSubtotal * b.discountValue) / 100) * 100) / 100;
        } else if (b.discountType === 'fixed') {
          billDiscountAmount = Math.min(billSubtotal, b.discountValue);
        }
        const billTaxable = Math.max(0, billSubtotal - billDiscountAmount);
        const billCgst = (billTaxable * b.cgstRate) / 100;
        const billSgst = (billTaxable * b.sgstRate) / 100;
        const billServiceCharge = b.serviceChargeRate > 0 ? (billTaxable * b.serviceChargeRate) / 100 : 0;
        const raw = billTaxable + billCgst + billSgst + billServiceCharge;
        const grand = settings.enableRoundOff ? Math.round(raw) : Math.round(raw * 100) / 100;
        const roundOff = settings.enableRoundOff ? Math.round((grand - raw) * 100) / 100 : 0;

        return {
          ...b,
          items: billItems,
          subtotal: billSubtotal,
          discountAmount: billDiscountAmount,
          cgstAmount: billCgst,
          sgstAmount: billSgst,
          serviceChargeAmount: billServiceCharge,
          roundOff,
          grandTotal: grand,
        };
      }
      return b;
    }));

    sounds.playTap();
  }, [tables, orders, settings]);

  // Adjust order line item quantity
  const updateOrderItemQuantity = useCallback((tableId: string, itemId: string, delta: number) => {
    const table = tables.find(t => t.id === tableId);
    const existingOrder = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    if (!existingOrder) return;

    const targetItem = existingOrder.items.find(it => it.id === itemId);
    if (!targetItem) return;

    const newQty = targetItem.quantity + delta;
    if (newQty <= 0) {
      removeOrderItem(tableId, itemId);
    } else {
      updateOrderItem(tableId, { ...targetItem, quantity: newQty });
    }
  }, [tables, orders, removeOrderItem, updateOrderItem]);

  // SEND KOT: Core Physical Workflow
  const sendKot = useCallback(async (
    tableId: string,
    newItems: CartItem[],
    notes?: string
  ): Promise<{ kot: KOT; printSuccess: boolean }> => {
    const table = tables.find(t => t.id === tableId);
    const floor = floors.find(f => f.id === table?.floorId);
    const now = new Date().toISOString();
    
    // 1. Get or create base order
    let currentOrder = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    
    // Items to be marked as sent
    const kotItemsList = newItems.map((item, idx) => ({
      id: `ki-${Date.now()}-${idx}`,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      variantName: item.variant?.name,
      addons: item.addons?.map(a => a.name),
      spiceLevel: item.spiceLevel,
      instructions: item.instructions,
      isVeg: item.isVeg,
    }));

    const kotNumber = 1000 + kots.length + 1;
    const kotId = `kot-${Date.now()}`;

    // Check configured KOT printer
    const kotPrinter = printers.find(p => p.type === 'kot' && p.isDefault) || printers.find(p => p.type === 'kot');
    const isPrinterError = kotPrinter?.status === 'error';
    const printStatus = isPrinterError ? 'failed' : 'printed';

    const newKOT: KOT = {
      id: kotId,
      kotNumber,
      orderId: currentOrder?.id || `ord-${Date.now()}`,
      tableId,
      tableNumber: table?.number || 'T-??',
      floorName: floor?.name || 'Main Hall',
      waiterId: currentUser?.id || 'waiter-1',
      waiterName: currentUser?.name || 'Staff',
      items: kotItemsList,
      createdAt: now,
      printedAt: printStatus === 'printed' ? now : undefined,
      printStatus,
      reprintCount: 0,
      notes,
    };

    // Mark sent items in order WITHOUT DUPLICATING them
    const newItemsMap = new Map(newItems.map(item => [item.id, item]));
    const existingItems = currentOrder ? currentOrder.items : [];
    
    // Update existing items that were in this unsent batch
    const updatedExistingItems = existingItems.map(item => {
      if (newItemsMap.has(item.id)) {
        return {
          ...item,
          kotId,
          isSentToKot: true,
        };
      }
      return item;
    });

    // Append any items that were not yet in existingItems
    const existingIds = new Set(existingItems.map(i => i.id));
    const freshlyAdded = newItems
      .filter(i => !existingIds.has(i.id))
      .map(i => ({ ...i, kotId, isSentToKot: true }));

    const updatedItems = [...updatedExistingItems, ...freshlyAdded];

    const subtotal = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    if (currentOrder) {
      const updatedOrder: Order = {
        ...currentOrder,
        items: updatedItems,
        kotIds: [...currentOrder.kotIds, kotId],
        subtotal,
        updatedAt: now,
      };
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } else {
      const newOrderNum = 1000 + orders.length + 1;
      currentOrder = {
        id: newKOT.orderId,
        orderNumber: newOrderNum,
        tableId,
        tableNumber: table?.number || 'T-??',
        floorId: table?.floorId || 'floor-ground',
        waiterId: currentUser?.id || 'waiter-1',
        waiterName: currentUser?.name || 'Staff',
        guestCount: table?.guestCount || 2,
        customerName: table?.customerName,
        customerPhone: table?.customerPhone,
        status: 'active',
        items: updatedItems,
        kotIds: [kotId],
        createdAt: now,
        updatedAt: now,
        subtotal,
      };
      setOrders(prev => [currentOrder!, ...prev]);
    }

    // Save KOT
    setKots(prev => [newKOT, ...prev]);

    // Update Table status
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'occupied',
          currentOrderId: currentOrder!.id,
          occupiedSince: t.occupiedSince || now,
        };
      }
      return t;
    }));

    // Audio chime
    sounds.playKotChime();

    // Log audit
    logAudit(
      'KOT Generated & Sent',
      'kot',
      `Sent KOT #${kotNumber} for Table ${table?.number} (${kotItemsList.length} items). Print status: ${printStatus.toUpperCase()}`
    );

    // Trigger Print feedback modal / sound
    if (printStatus === 'printed') {
      sounds.playPrinterFeed();
      setActivePrintDoc({
        type: 'kot',
        data: newKOT,
        isReprint: false,
      });
    } else {
      sounds.playAlert();
    }

    return { kot: newKOT, printSuccess: printStatus === 'printed' };
  }, [tables, floors, orders, kots, printers, currentUser, logAudit]);

  // Reprint KOT
  const reprintKot = useCallback((kotId: string) => {
    const kot = kots.find(k => k.id === kotId);
    if (!kot) return;

    const updatedKot: KOT = {
      ...kot,
      reprintCount: kot.reprintCount + 1,
      printStatus: 'printed',
      printedAt: new Date().toISOString(),
    };

    setKots(prev => prev.map(k => k.id === kotId ? updatedKot : k));
    sounds.playPrinterFeed();
    logAudit('KOT Reprinted', 'kot', `Reprinted KOT #${kot.kotNumber} for Table ${kot.tableNumber} (Reprint #${updatedKot.reprintCount})`);

    setActivePrintDoc({
      type: 'kot',
      data: updatedKot,
      isReprint: true,
    });
  }, [kots, logAudit]);

  // Cancel KOT
  const cancelKot = useCallback((kotId: string, reason: string) => {
    const kot = kots.find(k => k.id === kotId);
    if (!kot) return;

    logAudit('KOT Cancelled/Voided', 'kot', `Voided KOT #${kot.kotNumber} for Table ${kot.tableNumber}. Reason: ${reason}`);
    // Keep in record with updated notes
    setKots(prev => prev.map(k => k.id === kotId ? { ...k, notes: `CANCELLED: ${reason}` } : k));
  }, [kots, logAudit]);

  // Table status update
  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        if (status === 'available') {
          return {
            ...t,
            status,
            currentOrderId: undefined,
            occupiedSince: undefined,
            customerName: undefined,
            customerPhone: undefined,
            guestCount: undefined,
          };
        }
        return { ...t, status };
      }
      return t;
    }));
    logAudit('Table Status Changed', 'table', `Table ${tableId} changed status to ${status}`);
  }, [logAudit]);

  // Table Transfer
  const transferTable = useCallback((sourceTableId: string, targetTableId: string): boolean => {
    const sourceTable = tables.find(t => t.id === sourceTableId);
    const targetTable = tables.find(t => t.id === targetTableId);

    if (!sourceTable || !targetTable || !sourceTable.currentOrderId) return false;
    if (targetTable.status !== 'available' && targetTable.status !== 'reserved') return false;

    const orderId = sourceTable.currentOrderId;
    const now = new Date().toISOString();

    // Update order
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          tableId: targetTableId,
          tableNumber: targetTable.number,
          floorId: targetTable.floorId,
          updatedAt: now,
        };
      }
      return o;
    }));

    // Update target table
    setTables(prev => prev.map(t => {
      if (t.id === targetTableId) {
        return {
          ...t,
          status: 'occupied',
          currentOrderId: orderId,
          occupiedSince: sourceTable.occupiedSince || now,
          customerName: sourceTable.customerName,
          customerPhone: sourceTable.customerPhone,
          guestCount: sourceTable.guestCount,
          assignedWaiterId: sourceTable.assignedWaiterId,
        };
      }
      if (t.id === sourceTableId) {
        return {
          ...t,
          status: 'available',
          currentOrderId: undefined,
          occupiedSince: undefined,
          customerName: undefined,
          customerPhone: undefined,
          guestCount: undefined,
        };
      }
      return t;
    }));

    sounds.playTap();
    logAudit(
      'Table Transferred',
      'table',
      `Transferred active order from Table ${sourceTable.number} to Table ${targetTable.number}`
    );
    return true;
  }, [tables, logAudit]);

  // Merge Tables
  const mergeTables = useCallback((sourceTableIds: string[], targetTableId: string): boolean => {
    const targetTable = tables.find(t => t.id === targetTableId);
    if (!targetTable) return false;

    const now = new Date().toISOString();
    const sourceOrders = sourceTableIds
      .map(id => {
        const t = tables.find(tb => tb.id === id);
        return t?.currentOrderId ? orders.find(o => o.id === t.currentOrderId) : undefined;
      })
      .filter((o): o is Order => !!o);

    const mergedItems: CartItem[] = [];
    const mergedKotIds: string[] = [];

    sourceOrders.forEach(o => {
      mergedItems.push(...o.items);
      mergedKotIds.push(...o.kotIds);
    });

    const targetOrder = targetTable.currentOrderId ? orders.find(o => o.id === targetTable.currentOrderId) : undefined;
    if (targetOrder) {
      mergedItems.push(...targetOrder.items);
      mergedKotIds.push(...targetOrder.kotIds);
    }

    const subtotal = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const mergedOrderId = targetOrder ? targetOrder.id : `ord-${Date.now()}`;
    const newMergedOrder: Order = {
      id: mergedOrderId,
      orderNumber: targetOrder ? targetOrder.orderNumber : 1000 + orders.length + 1,
      tableId: targetTableId,
      tableNumber: targetTable.number,
      floorId: targetTable.floorId,
      waiterId: targetOrder?.waiterId || currentUser?.id || 'staff',
      waiterName: targetOrder?.waiterName || currentUser?.name || 'Staff',
      guestCount: (targetOrder?.guestCount || 2) + sourceOrders.reduce((sum, o) => sum + o.guestCount, 0),
      status: 'active',
      items: mergedItems,
      kotIds: mergedKotIds,
      createdAt: targetOrder?.createdAt || now,
      updatedAt: now,
      subtotal,
    };

    // Update orders: replace target order and delete source orders
    const sourceOrderIds = sourceOrders.map(o => o.id);
    setOrders(prev => [
      newMergedOrder,
      ...prev.filter(o => o.id !== targetOrder?.id && !sourceOrderIds.includes(o.id)),
    ]);

    // Update tables
    setTables(prev => prev.map(t => {
      if (t.id === targetTableId) {
        return {
          ...t,
          status: 'occupied',
          currentOrderId: mergedOrderId,
          occupiedSince: t.occupiedSince || now,
        };
      }
      if (sourceTableIds.includes(t.id)) {
        return {
          ...t,
          status: 'available',
          currentOrderId: undefined,
          occupiedSince: undefined,
          customerName: undefined,
          customerPhone: undefined,
        };
      }
      return t;
    }));

    sounds.playTap();
    logAudit(
      'Tables Merged',
      'table',
      `Merged ${sourceTableIds.length} tables into Table ${targetTable.number}. Combined ${mergedItems.length} items.`
    );
    return true;
  }, [tables, orders, currentUser, logAudit]);

  // Billing Operations
  const generateBill = useCallback((
    tableId: string,
    discountType: 'percentage' | 'fixed' | 'none' = 'none',
    discountValue: number = 0,
    discountReason?: string,
    customerGstin?: string
  ): Bill => {
    const table = tables.find(t => t.id === tableId);
    const floor = floors.find(f => f.id === table?.floorId);
    const order = table?.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : undefined;
    const now = new Date().toISOString();

    const items = order?.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round(((subtotal * discountValue) / 100) * 100) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(subtotal, discountValue);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const cgstAmount = (taxableAmount * settings.cgstRate) / 100;
    const sgstAmount = (taxableAmount * settings.sgstRate) / 100;
    const serviceChargeAmount = settings.enableServiceCharge 
      ? (taxableAmount * settings.serviceChargeRate) / 100 
      : 0;

    const rawTotal = taxableAmount + cgstAmount + sgstAmount + serviceChargeAmount;
    const grandTotal = settings.enableRoundOff ? Math.round(rawTotal) : Math.round(rawTotal * 100) / 100;
    const roundOff = settings.enableRoundOff ? Math.round((grandTotal - rawTotal) * 100) / 100 : 0;

    // Check if an unpaid bill already exists for this table
    const existingUnpaidBill = bills.find(b => b.tableId === tableId && b.status === 'unpaid');

    const invoiceNum = existingUnpaidBill
      ? existingUnpaidBill.invoiceNumber
      : `${settings.invoicePrefix}-${new Date().getFullYear()}-${String(bills.length + 1).padStart(4, '0')}`;
    const billId = existingUnpaidBill ? existingUnpaidBill.id : `bill-${Date.now()}`;

    const billData: Bill = {
      id: billId,
      invoiceNumber: invoiceNum,
      orderId: order?.id || existingUnpaidBill?.orderId || `ord-${Date.now()}`,
      tableId,
      tableNumber: table?.number || 'T-??',
      floorName: floor?.name || 'Main Hall',
      waiterId: order?.waiterId || existingUnpaidBill?.waiterId || currentUser?.id || 'staff',
      waiterName: order?.waiterName || existingUnpaidBill?.waiterName || currentUser?.name || 'Staff',
      customerName: table?.customerName || existingUnpaidBill?.customerName,
      customerPhone: table?.customerPhone || existingUnpaidBill?.customerPhone,
      customerGstin: customerGstin || existingUnpaidBill?.customerGstin,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      discountReason,
      cgstRate: settings.cgstRate,
      cgstAmount,
      sgstRate: settings.sgstRate,
      sgstAmount,
      serviceChargeRate: settings.enableServiceCharge ? settings.serviceChargeRate : 0,
      serviceChargeAmount,
      roundOff,
      grandTotal,
      status: 'unpaid',
      createdAt: existingUnpaidBill?.createdAt || now,
      reprintCount: existingUnpaidBill ? existingUnpaidBill.reprintCount : 0,
    };

    if (existingUnpaidBill) {
      setBills(prev => prev.map(b => b.id === existingUnpaidBill.id ? billData : b));
    } else {
      setBills(prev => [billData, ...prev]);
    }

    // Update table status to billing
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'billing' } : t));

    // Update order status
    if (order) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'billed', updatedAt: now } : o));
    }

    logAudit(
      'Bill Generated',
      'billing',
      `Generated Invoice ${invoiceNum} for Table ${table?.number}. Subtotal: ₹${subtotal}, Grand Total: ₹${grandTotal}`
    );

    // Open print preview
    setActivePrintDoc({
      type: 'bill',
      data: billData,
      isReprint: false,
    });
    sounds.playPrinterFeed();

    return billData;
  }, [tables, floors, orders, settings, bills, currentUser, logAudit]);

  // Save bill without printing/payment, complete the order, and release the table.
  // This is intentionally separate from settlePayment: SAVE must not invent a
  // payment method or mark an unpaid customer transaction as paid.
  const saveAndCompleteBill = useCallback((billId: string): boolean => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return false;

    const now = new Date().toISOString();

    // Keep the bill in billing history as unpaid. The transaction is completed
    // from the POS/table workflow, but no payment is fabricated.
    const updatedBill: Bill = {
      ...bill,
      status: 'unpaid',
    };

    setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));

    // Complete the associated order so it is no longer an active table order.
    setOrders(prev => prev.map(o =>
      o.id === bill.orderId
        ? { ...o, status: 'completed', updatedAt: now }
        : o
    ));

    // Release the table so the operator immediately returns to the tables view
    // with this table available for the next customer.
    setTables(prev => prev.map(t => {
      if (t.id !== bill.tableId) return t;
      return {
        ...t,
        status: 'available',
        currentOrderId: undefined,
        occupiedSince: undefined,
        customerName: undefined,
        customerPhone: undefined,
        guestCount: undefined,
      };
    }));

    logAudit(
      'Bill Saved & Order Completed',
      'billing',
      `Saved Invoice ${bill.invoiceNumber}. Order ${bill.orderId} completed and Table ${bill.tableNumber} released without recording payment.`
    );

    return true;
  }, [bills, logAudit]);

  // Settle Payment & Auto-Release Table
  const settlePayment = useCallback((billId: string, payment: PaymentDetails): boolean => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return false;

    const now = new Date().toISOString();

    const updatedBill: Bill = {
      ...bill,
      status: 'paid',
      payment,
      paidAt: now,
    };

    setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));

    // Complete order
    setOrders(prev => prev.map(o => {
      if (o.id === bill.orderId) {
        return { ...o, status: 'completed', updatedAt: now };
      }
      return o;
    }));

    // Auto-release Table to AVAILABLE
    setTables(prev => prev.map(t => {
      if (t.id === bill.tableId) {
        return {
          ...t,
          status: 'available',
          currentOrderId: undefined,
          occupiedSince: undefined,
          customerName: undefined,
          customerPhone: undefined,
          guestCount: undefined,
        };
      }
      return t;
    }));

    sounds.playPaymentSuccess();
    logAudit(
      'Payment Settled & Table Released',
      'payment',
      `Settled Invoice ${bill.invoiceNumber} (₹${bill.grandTotal}) via ${payment.method.toUpperCase()}. Table ${bill.tableNumber} is now Available.`
    );

    setActivePrintDoc({
      type: 'receipt',
      data: updatedBill,
      isReprint: false,
    });

    return true;
  }, [bills, logAudit]);

  const reprintBill = useCallback((billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const updatedBill: Bill = {
      ...bill,
      reprintCount: bill.reprintCount + 1,
    };

    setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
    sounds.playPrinterFeed();
    logAudit('Bill Reprinted', 'billing', `Reprinted Invoice ${bill.invoiceNumber}`);

    setActivePrintDoc({
      type: bill.status === 'paid' ? 'receipt' : 'bill',
      data: updatedBill,
      isReprint: true,
    });
  }, [bills, logAudit]);

  // Menu Handlers
  const toggleItemAvailability = useCallback((itemId: string) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextState = !item.isAvailable;
        logAudit(
          'Menu Item Stock Toggled',
          'menu',
          `Marked "${item.name}" as ${nextState ? 'IN STOCK' : 'OUT OF STOCK'}`
        );
        return { ...item, isAvailable: nextState };
      }
      return item;
    }));
    sounds.playTap();
  }, [logAudit]);

  const addMenuItem = useCallback((newItem: Omit<MenuItem, 'id'>): MenuItem => {
    const item: MenuItem = {
      ...newItem,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    setMenuItems(prev => [...prev, item]);
    logAudit('Menu Item Added', 'menu', `Added new menu item "${item.name}" (₹${item.price})`);
    return item;
  }, [logAudit]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
    logAudit('Menu Item Updated', 'menu', `Updated menu item "${item.name}"`);
  }, [logAudit]);

  const deleteMenuItem = useCallback((itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    setMenuItems(prev => prev.filter(i => i.id !== itemId));
    logAudit('Menu Item Deleted', 'menu', `Deleted menu item "${item?.name || itemId}"`);
  }, [menuItems, logAudit]);

  const addCategory = useCallback((name: string): MenuCategory => {
    const cat: MenuCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      order: categories.length + 1,
    };
    setCategories(prev => [...prev, cat]);
    logAudit('Category Added', 'menu', `Created new menu category "${name}"`);
    return cat;
  }, [categories.length, logAudit]);

  const updateCategory = useCallback((cat: MenuCategory) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
    logAudit('Category Updated', 'menu', `Updated menu category "${cat.name}"`);
  }, [logAudit]);

  const deleteCategory = useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    // Clean items in this category or retain them
    setMenuItems(prev => prev.filter(m => m.categoryId !== categoryId));
    logAudit('Category Deleted', 'menu', `Deleted menu category "${cat?.name || categoryId}"`);
  }, [categories, logAudit]);

  // Inventory Handlers
  const adjustInventoryStock = useCallback((
    itemId: string,
    changeQty: number,
    type: 'in' | 'waste' | 'adjustment',
    reason?: string
  ) => {
    const now = new Date().toISOString();
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextStock = Math.max(0, item.currentStock + changeQty);
        logAudit(
          'Inventory Adjusted',
          'inventory',
          `Adjusted "${item.name}" stock by ${changeQty > 0 ? '+' : ''}${changeQty} ${item.unit} (${type.toUpperCase()}). Reason: ${reason || 'Manual entry'}`
        );
        return { ...item, currentStock: nextStock, lastUpdated: now };
      }
      return item;
    }));
    sounds.playTap();
  }, [logAudit]);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      lastUpdated: now,
    };
    setInventory(prev => [...prev, newItem]);
    logAudit('Inventory Item Added', 'inventory', `Added "${item.name}" to inventory.`);
  }, [logAudit]);

  const updateInventoryItem = useCallback((item: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    logAudit('Inventory Item Updated', 'inventory', `Updated inventory item "${item.name}".`);
  }, [logAudit]);

  // Staff Handlers
  const addStaff = useCallback((newStaff: Omit<User, 'id' | 'createdAt'>) => {
    const u: User = {
      ...newStaff,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStaff(prev => [...prev, u]);
    logAudit('Staff Account Created', 'staff', `Created account for ${u.name} as ${u.role.toUpperCase()}`);
  }, [logAudit]);

  const updateStaff = useCallback((updated: User) => {
    setStaff(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    logAudit('Staff Account Updated', 'staff', `Updated staff details for ${updated.name}`);
  }, [currentUser, logAudit]);

  const deleteStaff = useCallback((userId: string) => {
    const u = staff.find(s => s.id === userId);
    setStaff(prev => prev.filter(s => s.id !== userId));
    logAudit('Staff Account Deleted', 'staff', `Deleted account for ${u?.name || userId}`);
  }, [staff, logAudit]);

  // Settings & Printers
  const updateSettings = useCallback((newSettings: Partial<RestaurantSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logAudit('Settings Updated', 'settings', 'Restaurant preferences and tax rates updated.');

    // Persist restaurant-facing settings to Supabase so the owner's logo and
    // business details are available after refresh and on other devices.
    if (isSupabaseConfigured && currentUser?.id) {
      void (async () => {
        try {
          const { data: member } = await supabase
            .from('restaurant_members')
            .select('restaurant_id')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          const restaurantId = member?.restaurant_id;
          if (!restaurantId) return;

          const dbUpdate: Record<string, unknown> = {};
          if (newSettings.name !== undefined) dbUpdate.name = newSettings.name;
          if (newSettings.legalName !== undefined) dbUpdate.legal_name = newSettings.legalName;
          if (newSettings.tagline !== undefined) dbUpdate.tagline = newSettings.tagline;
          if (newSettings.logo !== undefined) dbUpdate.logo_url = newSettings.logo || null;
          if (newSettings.address !== undefined) dbUpdate.address = newSettings.address;
          if (newSettings.phone !== undefined) dbUpdate.phone = newSettings.phone;
          if (newSettings.email !== undefined) dbUpdate.email = newSettings.email;
          if (newSettings.gstNumber !== undefined) dbUpdate.gst_number = newSettings.gstNumber;
          if (newSettings.fssaiNumber !== undefined) dbUpdate.fssai_number = newSettings.fssaiNumber;
          if (newSettings.currencySymbol !== undefined) dbUpdate.currency_symbol = newSettings.currencySymbol;
          if (newSettings.currencyCode !== undefined) dbUpdate.currency_code = newSettings.currencyCode;
          if (newSettings.invoicePrefix !== undefined) dbUpdate.invoice_prefix = newSettings.invoicePrefix;
          if (newSettings.cgstRate !== undefined) dbUpdate.cgst_rate = newSettings.cgstRate;
          if (newSettings.sgstRate !== undefined) dbUpdate.sgst_rate = newSettings.sgstRate;
          if (newSettings.serviceChargeRate !== undefined) dbUpdate.service_charge_rate = newSettings.serviceChargeRate;
          if (newSettings.enableServiceCharge !== undefined) dbUpdate.enable_service_charge = newSettings.enableServiceCharge;
          if (newSettings.enableRoundOff !== undefined) dbUpdate.enable_round_off = newSettings.enableRoundOff;

          if (Object.keys(dbUpdate).length > 0) {
            const { error } = await supabase.from('restaurants').update(dbUpdate).eq('id', restaurantId);
            if (error) console.warn('Unable to persist restaurant settings:', error);
          }
        } catch (error) {
          console.warn('Unable to persist restaurant settings:', error);
        }
      })();
    }
  }, [currentUser?.id, logAudit]);

  const updateDashboardWidgets = useCallback((widgets: DashboardWidgetConfig[]) => {
    setDashboardWidgets(widgets);
  }, []);

  const updatePrinters = useCallback((newPrinters: PrinterConfig[]) => {
    setPrinters(newPrinters);
    logAudit('Printers Configured', 'settings', 'Thermal printers configuration modified.');
  }, [logAudit]);

  const testPrint = useCallback((printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;

    sounds.playPrinterFeed();
    setActivePrintDoc({
      type: 'test',
      data: {
        title: `TEST PRINTOUT — ${printer.name}`,
        body: `Printer ID: ${printer.id}\nType: ${printer.type.toUpperCase()}\nConnection: ${printer.connection.toUpperCase()}\nPaper Size: ${printer.paperSize}\nStatus: ${printer.status.toUpperCase()}\nTime: ${new Date().toLocaleString('en-IN')}\n\n✓ THERMAL HEAD TEST OK\n✓ CUTTER MOTOR TEST OK`,
      },
    });
    logAudit('Printer Test Run', 'settings', `Executed test print on "${printer.name}"`);
  }, [printers, logAudit]);

  // Reset demo
  const resetAllData = useCallback(() => {
    try {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_DATA_VERSION);
    } catch (e) {}
    setFloors(INITIAL_FLOORS);
    setTables(INITIAL_TABLES);
    setCategories(INITIAL_CATEGORIES);
    setMenuItems(INITIAL_MENU_ITEMS);
    setOrders(INITIAL_ORDERS);
    setKots(INITIAL_KOTS);
    setBills(INITIAL_BILLS);
    setInventory(INITIAL_INVENTORY);
    setPrinters(INITIAL_PRINTERS);
    setSettings(INITIAL_SETTINGS);
    setDashboardWidgets(INITIAL_DASHBOARD_WIDGETS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSelectedFloorId('all');
    sounds.playAlert();
  }, []);

  const value: PosContextType = {
    currentUser,
    authSession,
    authLoading,
    authError,
    isSupabaseActive: isSupabaseConfigured,
    currentBranch,
    isOnline,
    selectedFloorId,
    activePrintDoc,
    printJob: activePrintDoc,
    setPrintJob: setActivePrintDoc,
    staff,
    branches,
    floors,
    tables,
    categories,
    menuItems,
    orders,
    kots,
    bills,
    inventory,
    printers,
    settings,
    dashboardWidgets,
    auditLogs,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updateUserPassword,
    resendVerificationEmail,
    setCurrentUser,
    setCurrentBranch,
    setSelectedFloorId,
    setIsOnline,
    setActivePrintDoc,
    switchUserById,
    logout,
    getTableOrder,
    getTableKots,
    saveDraftOrder,
    updateOrderItem,
    removeOrderItem,
    updateOrderItemQuantity,
    sendKot,
    reprintKot,
    cancelKot,
    addFloor,
    updateFloor,
    deleteFloor,
    updateTableStatus,
    transferTable,
    mergeTables,
    addTable,
    updateTable,
    deleteTable,
    generateBill,
    settlePayment,
    saveAndCompleteBill,
    reprintBill,
    toggleItemAvailability,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    updateCategory,
    deleteCategory,
    adjustInventoryStock,
    addInventoryAdjustment: (itemId: string, delta: number, type: any, reason?: string) => adjustInventoryStock(itemId, delta, type === 'wastage' ? 'waste' : type === 'purchase' ? 'in' : 'adjustment', reason),
    updateInventoryStock: (itemId: string, delta: number, type: any, reason?: string) => adjustInventoryStock(itemId, delta, type === 'wastage' ? 'waste' : type === 'purchase' ? 'in' : 'adjustment', reason),
    addInventoryItem,
    updateInventoryItem,
    addStaff,
    addStaffMember: addStaff,
    updateStaff,
    updateStaffMember: (id: string, updates: any) => {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      logAudit('Staff Updated', 'staff', `Updated details for staff ID ${id}`);
    },
    deleteStaff,
    deleteStaffMember: deleteStaff,
    updateSettings,
    updateDashboardWidgets,
    updatePrinters,
    testPrint,
    resetAllData,
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
