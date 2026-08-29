import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { MenuItem, CartItem, TableStatus } from '../types';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { ItemCustomizerModal } from '../components/ItemCustomizerModal';
import { TableTransferModal } from '../components/TableTransferModal';
import { TableMergeModal } from '../components/TableMergeModal';
import { TableManagementModal } from '../components/TableManagementModal';
import { AddMenuItemModal } from '../components/AddMenuItemModal';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Receipt,
  ArrowRightLeft,
  Merge,
  History,
  X,
  Printer,
  ChevronLeft,
  Layers,
  Users,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Phone,
  User as UserIcon,
  Edit3,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface PosOrdersPageProps {
  onNavigateToBilling: (tableId?: string) => void;
  onOpenTableManagement?: () => void;
}

export const PosOrdersPage: React.FC<PosOrdersPageProps> = ({
  onNavigateToBilling,
}) => {
  const {
    floors,
    tables,
    categories,
    menuItems,
    selectedFloorId,
    setSelectedFloorId,
    getTableOrder,
    getTableKots,
    saveDraftOrder,
    updateOrderItem,
    sendKot,
    reprintKot,
    currentUser,
    updateTableStatus,
  } = usePos();

  // STAGE 1 vs STAGE 2: activeTableId is NULL on start (Stage 1: Table Selection First)
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Table Search & Filter in Stage 1
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'available' | 'occupied' | 'billing'>('all');

  // Menu Filters in Stage 2
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg' | 'popular' | 'available' | 'unavailable'>('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');

  // Cart & Order State for Active Table in Stage 2
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isTableMgmtModalOpen, setIsTableMgmtModalOpen] = useState(false);
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [showKotHistoryDrawer, setShowKotHistoryDrawer] = useState(false);
  const [isSendingKot, setIsSendingKot] = useState(false);

  // Active Table references
  const activeTable = useMemo(() => tables.find(t => t.id === activeTableId), [tables, activeTableId]);
  const activeOrder = useMemo(() => activeTableId ? getTableOrder(activeTableId) : undefined, [activeTableId, getTableOrder]);
  const activeTableKots = useMemo(() => activeTableId ? getTableKots(activeTableId) : [], [activeTableId, getTableKots]);

  // Sync cart when active table opens
  useEffect(() => {
    if (!activeTableId) {
      setCartItems([]);
      return;
    }

    if (activeOrder) {
      setCartItems(activeOrder.items || []);
      setGuestCount(activeOrder.guestCount || activeTable?.guestCount || 2);
      setCustomerName(activeOrder.customerName || activeTable?.customerName || '');
      setCustomerPhone(activeOrder.customerPhone || activeTable?.customerPhone || '');
    } else if (activeTable) {
      setCartItems([]);
      setGuestCount(activeTable.guestCount || activeTable.capacity || 2);
      setCustomerName(activeTable.customerName || '');
      setCustomerPhone(activeTable.customerPhone || '');
    }
  }, [activeTableId, activeOrder?.id, activeTable?.id]);

  // Filter Tables for Stage 1
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (selectedFloorId !== 'all' && t.floorId !== selectedFloorId) {
        return false;
      }
      if (tableStatusFilter !== 'all') {
        if (tableStatusFilter === 'occupied' && (t.status !== 'occupied' && t.status !== 'ordering')) {
          return false;
        }
        if (tableStatusFilter === 'available' && t.status !== 'available') {
          return false;
        }
        if (tableStatusFilter === 'billing' && t.status !== 'billing') {
          return false;
        }
      }
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase();
        const matchNumber = t.number.toLowerCase().includes(q);
        const matchCustomer = t.customerName?.toLowerCase().includes(q);
        if (!matchNumber && !matchCustomer) return false;
      }
      return true;
    });
  }, [tables, selectedFloorId, tableStatusFilter, tableSearchQuery]);

  // Filter Menu Items for Stage 2
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (dietaryFilter === 'veg' && !item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'non-veg' && item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'available' && !item.isAvailable) {
        return false;
      }
      if (dietaryFilter === 'unavailable' && item.isAvailable) {
        return false;
      }
      if (dietaryFilter === 'popular') {
        // High popularity categories or signature specials
        const isPopularItem = item.categoryId === 'cat-pizza' || item.categoryId === 'cat-white-fog-specials' || item.id.includes('spl') || item.id.includes('margherita') || item.id.includes('alfredo');
        if (!isPopularItem) return false;
      }
      if (menuSearchQuery.trim()) {
        const q = menuSearchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.shortCode?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, dietaryFilter, menuSearchQuery]);

  // Select Table -> Enter Stage 2
  const handleSelectTable = (tableId: string) => {
    setActiveTableId(tableId);
    sounds.playTap();
  };

  // Back to Table Grid -> Return to Stage 1
  const handleBackToTables = () => {
    setActiveTableId(null);
    sounds.playTap();
  };

  // Quick 1-click Add Item to Cart
  const handleQuickAddItem = (item: MenuItem) => {
    if (!item.isAvailable) {
      sounds.playAlert();
      return;
    }

    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      setCustomizingItem(item);
      return;
    }

    const existingIndex = cartItems.findIndex(
      ci => ci.menuItemId === item.id && !ci.isSentToKot && !ci.variant && (!ci.addons || ci.addons.length === 0) && !ci.instructions
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1,
      };
    } else {
      const newCartLine: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        isVeg: item.isVeg,
        isSentToKot: false,
      };
      updated = [...cartItems, newCartLine];
    }

    setCartItems(updated);
    if (activeTableId) {
      saveDraftOrder(activeTableId, updated, guestCount, customerName, customerPhone);
    }
    sounds.playTap();
  };

  const handleAddFromCustomizer = (customizedCartItem: CartItem) => {
    const updated = [...cartItems, customizedCartItem];
    setCartItems(updated);
    if (activeTableId) {
      saveDraftOrder(activeTableId, updated, guestCount, customerName, customerPhone);
    }
  };

  const handleEditCartItem = (cartItem: CartItem) => {
    const foundMenuItem = menuItems.find(m => m.id === cartItem.menuItemId) || {
      id: cartItem.menuItemId,
      name: cartItem.name,
      price: cartItem.price,
      categoryId: 'all',
      isVeg: cartItem.isVeg ?? true,
      isAvailable: true,
      variants: cartItem.variant ? [cartItem.variant] : undefined,
      addons: cartItem.addons || undefined,
    };
    setEditingCartItem(cartItem);
    setCustomizingItem(foundMenuItem);
    sounds.playTap();
  };

  const handleUpdateFromCustomizer = (updatedCartItem: CartItem) => {
    const updated = cartItems.map(it => it.id === updatedCartItem.id ? updatedCartItem : it);
    setCartItems(updated);
    if (activeTableId) {
      saveDraftOrder(activeTableId, updated, guestCount, customerName, customerPhone);
      updateOrderItem(activeTableId, updatedCartItem);
    }
    setEditingCartItem(null);
    setCustomizingItem(null);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const item = cartItems[index];
    if (!item) return;

    const updated = [...cartItems];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...item, quantity: newQty };
    }
    setCartItems(updated);
    if (activeTableId) {
      saveDraftOrder(activeTableId, updated, guestCount, customerName, customerPhone);
    }
    sounds.playTap();
  };

  const handleRemoveLine = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
    if (activeTableId) {
      saveDraftOrder(activeTableId, updated, guestCount, customerName, customerPhone);
    }
    sounds.playTap();
  };

  // SEND KOT Action
  const handleSendKot = async () => {
    if (!activeTableId) return;

    const unsentItems = cartItems.filter(ci => !ci.isSentToKot);
    if (unsentItems.length === 0) {
      sounds.playAlert();
      return;
    }

    setIsSendingKot(true);
    try {
      await sendKot(activeTableId, unsentItems, orderNotes);
      const updatedOrder = getTableOrder(activeTableId);
      if (updatedOrder) {
        setCartItems(updatedOrder.items);
      }
      setOrderNotes('');
    } finally {
      setIsSendingKot(false);
    }
  };

  // Subtotals & Calculations
  const unsentCount = cartItems.filter(ci => !ci.isSentToKot).length;
  const sentCount = cartItems.filter(ci => ci.isSentToKot).length;
  const orderSubtotal = cartItems.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);


  // =========================================================================
  // STAGE 1: TABLE SELECTION SCREEN (WHEN NO TABLE IS CURRENTLY OPENED)
  // =========================================================================
  if (!activeTableId || !activeTable) {
    const totalTablesCount = tables.length;

    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa] overflow-y-auto select-none p-4 md:p-6">
        
        {/* Stage 1 Top Bar: Summary & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 md:p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6321]" />
              <h1 className="text-lg md:text-xl font-black text-[#1a1a1a] tracking-tight">
                Table & Floor Selection
              </h1>
            </div>
            <p className="text-xs text-[#6b7280]">
              Select a table below to start or manage an order
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Manage Floors & Tables Button */}
            <button
              type="button"
              id="open-table-mgmt-btn"
              onClick={() => setIsTableMgmtModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#FF6321]" />
              <span>Manage Tables & Floors</span>
            </button>
          </div>
        </div>

        {/* Floor Filter Bar & Table Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Floor tabs */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
            <button
              type="button"
              id="floor-filter-all-btn"
              onClick={() => {
                setSelectedFloorId('all');
                sounds.playTap();
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                selectedFloorId === 'all'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'bg-white border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-50'
              }`}
            >
              All Floors ({tables.length})
            </button>

            {floors.map(floor => {
              const count = tables.filter(t => t.floorId === floor.id).length;
              const isSelected = selectedFloorId === floor.id;
              return (
                <button
                  key={floor.id}
                  id={`floor-filter-${floor.id}-btn`}
                  onClick={() => {
                    setSelectedFloorId(floor.id);
                    sounds.playTap();
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1a1a] text-white shadow-xs'
                      : 'bg-white border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-50'
                  }`}
                >
                  {floor.name} ({count})
                </button>
              );
            })}

            {floors.length === 0 && (
              <button
                type="button"
                onClick={() => setIsTableMgmtModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-dashed border-[#FF6321] text-[#FF6321] text-xs font-bold hover:bg-[#fff1eb] cursor-pointer"
              >
                + Add Floor
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="search-tables-input"
              value={tableSearchQuery}
              onChange={e => setTableSearchQuery(e.target.value)}
              placeholder="Search table number..."
              className="w-full pl-9.5 pr-4 py-2 bg-white border border-[#e5e7eb] rounded-2xl text-xs font-bold text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden focus:border-[#FF6321]"
            />
            {tableSearchQuery && (
              <button
                type="button"
                onClick={() => setTableSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty State: No Tables Configured */}
        {tables.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-[#e5e7eb] text-center my-6">
            <div className="w-16 h-16 rounded-3xl bg-[#fff1eb] text-[#FF6321] flex items-center justify-center mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-[#1a1a1a] mb-1">
              No Tables Added Yet
            </h2>
            <p className="text-xs text-[#6b7280] max-w-md mb-6">
              Your restaurant layout is currently clean. Add your restaurant floors and tables to begin taking live orders and printing KOTs.
            </p>
            <button
              type="button"
              id="empty-state-add-table-btn"
              onClick={() => setIsTableMgmtModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FF6321]" />
              <span>+ Add Tables & Floors</span>
            </button>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#e5e7eb] text-gray-500 font-semibold text-xs my-6">
            No tables match the current floor or search filter.
          </div>
        ) : (
          /* Table Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-12">
            {filteredTables.map(table => {
              const order = getTableOrder(table.id);
              const orderTotal = order?.subtotal || 0;
              const floorName = floors.find(f => f.id === table.floorId)?.name || 'Ground Floor';
              const isOccupied = table.status === 'occupied' || table.status === 'ordering';
              const isBilling = table.status === 'billing';

              return (
                <div
                  key={table.id}
                  id={`table-card-${table.id}`}
                  onClick={() => handleSelectTable(table.id)}
                  className={`flex flex-col justify-between p-4 md:p-5 rounded-3xl border-2 bg-white transition-all cursor-pointer select-none group shadow-2xs hover:shadow-md ${
                    isOccupied
                      ? 'border-blue-500 hover:border-blue-600 bg-blue-50/40'
                      : isBilling
                      ? 'border-blue-500 hover:border-blue-600 bg-blue-50/20'
                      : 'border-transparent hover:border-[#1a1a1a]'
                  }`}
                >
                  {/* Top: Table Number & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-2xl md:text-3xl font-black tracking-tight transition ${isOccupied || isBilling ? 'text-blue-700 group-hover:text-blue-800' : 'text-[#1a1a1a] group-hover:text-[#FF6321]'}`}>
                        {table.number}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6b7280] mb-3">
                      <span>{floorName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>{table.capacity} Seats</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Status Specific Information */}
                  <div className="pt-3 border-t border-[#e5e7eb]/60">
                    {isOccupied || isBilling ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280]">
                            Running Total
                          </span>
                          <span className="text-sm font-black text-[#1a1a1a]">
                            {formatCurrency(orderTotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-[#6b7280]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {table.occupiedSince ? formatDuration(table.occupiedSince) : 'Active'}
                          </span>
                          <span>{order?.items?.length || 0} items</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-bold text-[#6b7280] group-hover:text-[#1a1a1a] transition">
                        <span>Ready for Order</span>
                        <span className="text-xs text-[#FF6321] font-black">Open →</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table Management Modal */}
        <TableManagementModal
          isOpen={isTableMgmtModalOpen}
          onClose={() => setIsTableMgmtModalOpen(false)}
          initialFloorId={selectedFloorId}
        />
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: ORDER SCREEN (AFTER A TABLE HAS BEEN SELECTED)
  // =========================================================================
  const activeFloor = floors.find(f => f.id === activeTable.floorId);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-w-0 bg-[#f3f4f6] overflow-hidden select-none">
      
      {/* LEFT & CENTER: Fast Menu Browser & Order Header */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6] overflow-hidden border-r border-[#e5e7eb]">
        
        {/* STAGE 2 TOP BAR: Back button, Table Context & Quick Actions */}
        <div className="bg-white px-4 md:px-6 py-3 border-b border-[#e5e7eb] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          
          {/* Back to Tables Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="back-to-tables-btn"
              onClick={handleBackToTables}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f8f9fa] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-white border border-[#e5e7eb] rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#FF6321]" />
              <span>Tables</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#1a1a1a] tracking-tight">
                  Table {activeTable.number}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#6b7280]">
                {activeFloor?.name || 'Main Hall'} • Capacity: {activeTable.capacity} Seats
              </p>
            </div>
          </div>

          {/* Quick Table Utilities */}
          <div className="flex items-center gap-2">
            {/* Guest Count Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-[#f8f9fa] p-1 rounded-2xl border border-[#e5e7eb]">
              <span className="text-[10px] font-bold uppercase text-[#6b7280] px-2">Guests:</span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, guestCount - 1);
                  setGuestCount(next);
                  saveDraftOrder(activeTable.id, cartItems, next, customerName, customerPhone);
                }}
                className="w-6 h-6 rounded-lg bg-white border border-[#e5e7eb] text-xs font-bold hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-xs font-black text-[#1a1a1a]">{guestCount}</span>
              <button
                type="button"
                onClick={() => {
                  const next = guestCount + 1;
                  setGuestCount(next);
                  saveDraftOrder(activeTable.id, cartItems, next, customerName, customerPhone);
                }}
                className="w-6 h-6 rounded-lg bg-white border border-[#e5e7eb] text-xs font-bold hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Transfer Table */}
            <button
              type="button"
              id="order-transfer-table-btn"
              onClick={() => setIsTransferModalOpen(true)}
              className="p-2 bg-[#f8f9fa] hover:bg-gray-100 border border-[#e5e7eb] rounded-xl text-gray-700 transition cursor-pointer"
              title="Transfer Table"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Merge Tables */}
            <button
              type="button"
              id="order-merge-tables-btn"
              onClick={() => setIsMergeModalOpen(true)}
              className="p-2 bg-[#f8f9fa] hover:bg-gray-100 border border-[#e5e7eb] rounded-xl text-gray-700 transition cursor-pointer"
              title="Merge Tables"
            >
              <Merge className="w-4 h-4" />
            </button>

            {/* KOT History */}
            <button
              type="button"
              id="order-kot-history-btn"
              onClick={() => setShowKotHistoryDrawer(!showKotHistoryDrawer)}
              className="p-2 bg-[#f8f9fa] hover:bg-gray-100 border border-[#e5e7eb] rounded-xl text-gray-700 transition cursor-pointer relative"
              title="KOT History"
            >
              <History className="w-4 h-4" />
              {activeTableKots.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6321] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeTableKots.length}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Menu Search, Filters & Add Dish Bar */}
        <div className="p-4 md:p-5 bg-white border-b border-[#e5e7eb] space-y-3 shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="search-menu-items-input"
                value={menuSearchQuery}
                onChange={e => setMenuSearchQuery(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-9.5 pr-4 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl text-xs font-bold text-[#1a1a1a] placeholder-gray-400 focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
              />
              {menuSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMenuSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Add Dish Shortcut */}
            <button
              type="button"
              id="quick-add-dish-btn"
              onClick={() => setIsAddDishModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0"
              title="Add Menu Item"
            >
              <Plus className="w-4 h-4 text-[#FF6321]" />
              <span className="hidden sm:inline">Add Dish</span>
            </button>
          </div>

          {/* Quick Dietary & Availability Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar text-xs">
            <button
              type="button"
              id="filter-all"
              onClick={() => {
                setDietaryFilter('all');
                sounds.playTap();
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'all'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>

            <button
              type="button"
              id="filter-veg"
              onClick={() => {
                setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg');
                sounds.playTap();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'veg'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-green-700 hover:bg-green-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-white" />
              <span>Veg</span>
            </button>

            <button
              type="button"
              id="filter-non-veg"
              onClick={() => {
                setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg');
                sounds.playTap();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'non-veg'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-red-700 hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              <span>Non-Veg</span>
            </button>

            <button
              type="button"
              id="filter-popular"
              onClick={() => {
                setDietaryFilter(dietaryFilter === 'popular' ? 'all' : 'popular');
                sounds.playTap();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'popular'
                  ? 'bg-[#FF6321] text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#FF6321] hover:bg-orange-50'
              }`}
            >
              <span>★ Popular</span>
            </button>

            <button
              type="button"
              id="filter-available"
              onClick={() => {
                setDietaryFilter(dietaryFilter === 'available' ? 'all' : 'available');
                sounds.playTap();
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'available'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-600 hover:bg-gray-100'
              }`}
            >
              Available
            </button>

            <button
              type="button"
              id="filter-unavailable"
              onClick={() => {
                setDietaryFilter(dietaryFilter === 'unavailable' ? 'all' : 'unavailable');
                sounds.playTap();
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
                dietaryFilter === 'unavailable'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-500 hover:bg-gray-100'
              }`}
            >
              Unavailable
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
            <button
              type="button"
              id="cat-filter-all"
              onClick={() => {
                setSelectedCategoryId('all');
                sounds.playTap();
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100'
              }`}
            >
              All Items ({menuItems.length})
            </button>

            {categories.map(cat => {
              const count = menuItems.filter(m => m.categoryId === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-filter-${cat.id}`}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    sounds.playTap();
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1a1a] text-white shadow-xs'
                      : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

        </div>

        {/* Menu Items Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-[#e5e7eb] text-center my-6">
              <div className="w-16 h-16 rounded-3xl bg-[#fff1eb] text-[#FF6321] flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-[#1a1a1a] mb-1">Your Menu is Empty</h3>
              <p className="text-xs text-[#6b7280] max-w-sm mb-5">
                Add your restaurant food items, beverages, and dishes to start taking customer orders.
              </p>
              <button
                type="button"
                id="empty-menu-add-dish-btn"
                onClick={() => setIsAddDishModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#FF6321]" />
                <span>Add Your First Dish</span>
              </button>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-[#e5e7eb] text-gray-500 font-semibold text-xs my-6">
              No menu items found matching the selected filter or search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMenuItems.map(item => {
                const isOutOfStock = !item.isAvailable;
                const hasVariants = (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0);
                const cartLineCount = cartItems
                  .filter(ci => ci.menuItemId === item.id)
                  .reduce((sum, ci) => sum + ci.quantity, 0);

                return (
                  <div
                    key={item.id}
                    id={`menu-item-card-${item.id}`}
                    onClick={() => {
                      if (hasVariants) {
                        setCustomizingItem(item);
                      } else {
                        handleQuickAddItem(item);
                      }
                    }}
                    className={`flex flex-col justify-between p-3.5 rounded-3xl bg-white border border-[#e5e7eb] hover:border-[#FF6321] hover:shadow-md transition-all cursor-pointer select-none group relative overflow-hidden ${
                      isOutOfStock ? 'opacity-50 grayscale' : ''
                    } ${cartLineCount > 0 ? 'ring-2 ring-[#FF6321]/30 border-[#FF6321]' : ''}`}
                  >
                    {/* Top: Image or Icon & Veg indicator */}
                    <div className="flex items-start gap-3 mb-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-[#e5e7eb] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#fff1eb] border border-orange-200 flex items-center justify-center text-[#FF6321] shrink-0">
                          <UtensilsCrossed className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                          <h4 className="text-xs font-black text-[#1a1a1a] truncate group-hover:text-[#FF6321] transition">
                            {item.name}
                          </h4>
                        </div>
                        
                        {/* Variant preview tags */}
                        {item.variants && item.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.variants.map(v => (
                              <span key={v.id} className="text-[9px] font-bold px-1.5 py-0.5 bg-[#f8f9fa] text-[#6b7280] rounded-md border border-gray-200">
                                {v.name}
                              </span>
                            ))}
                          </div>
                        ) : item.shortCode ? (
                          <span className="text-[10px] font-bold text-[#6b7280] uppercase">
                            #{item.shortCode}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom: Price and Add button */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]/60">
                      <div>
                        <span className="text-xs font-black text-[#1a1a1a]">
                          {formatCurrency(item.price)}
                        </span>
                        {hasVariants && (
                          <span className="text-[10px] text-[#FF6321] block font-bold">Customize →</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cartLineCount > 0 && (
                          <span className="px-2 py-0.5 bg-[#FF6321] text-white text-[10px] font-black rounded-lg">
                            {cartLineCount} in order
                          </span>
                        )}

                        <button
                          type="button"
                          id={`quick-add-btn-${item.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            if (hasVariants) {
                              setCustomizingItem(item);
                            } else {
                              handleQuickAddItem(item);
                            }
                          }}
                          disabled={isOutOfStock}
                          className="w-8 h-8 rounded-xl bg-[#f8f9fa] group-hover:bg-[#1a1a1a] text-[#1a1a1a] group-hover:text-white border border-[#e5e7eb] flex items-center justify-center font-black transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-[#FF6321]" />
                        </button>
                      </div>
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>

      {/* RIGHT PANE: Fast Cart, Line Items & Send KOT */}
      <section className="w-full md:w-96 lg:w-[420px] bg-white flex flex-col h-full border-l border-[#e5e7eb] shadow-md shrink-0">
        
        {/* Cart Header */}
        <div className="p-4 md:p-5 border-b border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6b7280] block">
              Active Order Summary
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#1a1a1a]">Table {activeTable.number}</span>
              <span className="text-xs text-[#6b7280]">({cartItems.length} items)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unsentCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-xl border border-amber-200">
                {unsentCount} Unsent
              </span>
            )}
            {sentCount > 0 && (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase rounded-xl border border-green-200">
                {sentCount} In Kitchen
              </span>
            )}
          </div>
        </div>

        {/* Cart Line Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-center text-gray-400 mb-3">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-600">No items added to this table</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Click any menu item on the left to add it to the order
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => {
              const lineTotal = item.price * item.quantity;
              const isSent = item.isSentToKot;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition ${
                    isSent
                      ? 'bg-green-50/40 border-green-200'
                      : 'bg-[#f8f9fa] border-[#e5e7eb]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-black text-[#1a1a1a] truncate">{item.name}</span>
                        {isSent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-200 text-green-800 rounded-md">
                            KOT Sent
                          </span>
                        )}
                      </div>

                      {/* Customization Details */}
                      {(item.variant || (item.addons && item.addons.length > 0) || item.instructions || item.spiceLevel) && (
                        <div className="text-[10px] text-[#6b7280] font-semibold mt-0.5 pl-3.5 space-y-0.5">
                          {item.variant && <span>Size: {item.variant.name} • </span>}
                          {item.spiceLevel && item.spiceLevel !== 'Medium' && <span>Spice: {item.spiceLevel} • </span>}
                          {item.addons && item.addons.length > 0 && (
                            <span>+ {item.addons.map(a => a.name).join(', ')} • </span>
                          )}
                          {item.instructions && (
                            <span className="text-amber-700 italic block">Note: "{item.instructions}"</span>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-black text-[#1a1a1a] shrink-0">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>

                  {/* Quantity, Edit & Delete Controls */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6b7280] font-semibold">
                        {formatCurrency(item.price)} each
                      </span>
                      <button
                        type="button"
                        id={`cart-edit-btn-${index}`}
                        onClick={() => handleEditCartItem(item)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#e5e7eb] hover:bg-orange-50 hover:border-orange-200 text-[10px] font-bold text-[#FF6321] transition cursor-pointer"
                        title="Edit quantity, size, add-ons or instructions"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`cart-minus-btn-${index}`}
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#e5e7eb] hover:bg-gray-100 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-black text-[#1a1a1a]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        id={`cart-plus-btn-${index}`}
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="w-6 h-6 rounded-lg bg-[#1a1a1a] text-white hover:bg-black flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-[#FF6321]" />
                      </button>

                      <button
                        type="button"
                        id={`cart-delete-btn-${index}`}
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg ml-1 transition cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Chef Order Notes input */}
        <div className="px-4 py-2 bg-[#f8f9fa] border-t border-[#e5e7eb]">
          <input
            type="text"
            id="order-kitchen-notes-input"
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            placeholder="Special Kitchen / Chef Instructions..."
            className="w-full px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-xl text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden focus:border-[#FF6321]"
          />
        </div>

        {/* Footer Subtotal & Action Buttons */}
        <div className="p-4 border-t border-[#e5e7eb] bg-white space-y-3">
          
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-[#6b7280]">Subtotal</span>
            <span className="text-base font-black text-[#1a1a1a]">{formatCurrency(orderSubtotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Send KOT Button */}
            <button
              type="button"
              id="send-kot-btn"
              onClick={handleSendKot}
              disabled={unsentCount === 0 || isSendingKot}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#FF6321] hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xs transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingKot ? 'Sending...' : `Send KOT (${unsentCount})`}</span>
            </button>

            {/* Bill & Settle Button */}
            <button
              type="button"
              id="proceed-to-billing-btn"
              onClick={() => onNavigateToBilling(activeTable.id)}
              disabled={cartItems.length === 0}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1a1a1a] hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#FF6321]" />
              <span>Bill / Settle</span>
            </button>
          </div>

        </div>

      </section>

      {/* KOT History Drawer */}
      {showKotHistoryDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 bg-white shadow-2xl border-l border-[#e5e7eb] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb] bg-[#f8f9fa]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#FF6321]" />
              <h3 className="font-extrabold text-sm text-[#1a1a1a]">
                KOT History — Table {activeTable.number}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowKotHistoryDrawer(false)}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTableKots.length === 0 ? (
              <div className="text-center p-8 text-xs text-gray-400 font-semibold">
                No KOTs have been sent for this table yet.
              </div>
            ) : (
              activeTableKots.map(kot => (
                <div key={kot.id} className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1a1a1a]">KOT #{kot.kotNumber}</span>
                    <span className="text-[10px] text-[#6b7280]">
                      {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-700">
                    {kot.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-semibold text-[11px]">
                        <span>{it.quantity}x {it.name} {it.variantName ? `(${it.variantName})` : ''}</span>
                      </div>
                    ))}
                  </div>

                  {kot.notes && (
                    <p className="text-[10px] text-amber-700 italic bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      Note: {kot.notes}
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => reprintKot(kot.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#1a1a1a] hover:text-[#FF6321] px-2 py-1 bg-white border border-[#e5e7eb] rounded-lg cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-[#FF6321]" />
                      <span>Reprint KOT</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Item Customizer Modal */}
      {customizingItem && (
        <ItemCustomizerModal
          item={customizingItem}
          isOpen={!!customizingItem}
          initialCartItem={editingCartItem}
          onClose={() => {
            setCustomizingItem(null);
            setEditingCartItem(null);
          }}
          onAddToCart={handleAddFromCustomizer}
          onUpdateCartItem={handleUpdateFromCustomizer}
        />
      )}

      {/* Table Transfer Modal */}
      <TableTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentTableId={activeTable.id}
      />

      {/* Table Merge Modal */}
      <TableMergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        currentTableId={activeTable.id}
      />

      {/* Add Dish Modal */}
      <AddMenuItemModal
        isOpen={isAddDishModalOpen}
        onClose={() => setIsAddDishModalOpen(false)}
        initialCategoryId={selectedCategoryId}
      />

    </div>
  );
};
