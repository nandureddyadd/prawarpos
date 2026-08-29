import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { Table, Bill, PaymentMethod, PaymentDetails } from '../types';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';
import {
  CreditCard,
  Receipt,
  QrCode,
  Banknote,
  Percent,
  Split,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Search,
  Edit3,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { ItemCustomizerModal } from '../components/ItemCustomizerModal';
import { MenuItem, CartItem } from '../types';
import { sounds } from '../utils/audio';

interface BillingPageProps {
  initialTableId?: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ initialTableId }) => {
  const {
    tables,
    bills,
    floors,
    menuItems,
    getTableOrder,
    generateBill,
    settlePayment,
    reprintBill,
    updateOrderItem,
    removeOrderItem,
    updateOrderItemQuantity,
    settings,
    currentUser,
  } = usePos();

  // Find tables with active orders or billing status
  const billingEligibleTables = useMemo(() => {
    return tables.filter(
      t => t.status === 'billing' || t.status === 'occupied' || t.status === 'ordering'
    );
  }, [tables]);

  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (initialTableId && tables.some(t => t.id === initialTableId)) {
      return initialTableId;
    }
    return billingEligibleTables[0]?.id || tables[0]?.id || '';
  });

  // Editing Item before printing state
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [customizingMenuItem, setCustomizingMenuItem] = useState<MenuItem | null>(null);

  // Discount controls
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('');

  // Payment Mode & Tendered Cash
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardAuthRef, setCardAuthRef] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('UPI-REF-' + Math.floor(100000 + Math.random() * 900000));

  // Split Bill State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [splitGuestCount, setSplitGuestCount] = useState<number>(2);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitUpiAmount, setSplitUpiAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);

  // Tab: Active Billing vs Paid History
  const [activeView, setActiveView] = useState<'active' | 'history'>('active');

  const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
  const activeOrder = useMemo(() => selectedTableId ? getTableOrder(selectedTableId) : undefined, [selectedTableId, getTableOrder]);

  // Find existing unpaid bill for this table, if any
  const existingBill = useMemo(() => {
    return bills.find(b => b.tableId === selectedTableId && b.status === 'unpaid');
  }, [bills, selectedTableId]);

  // Calculation for live preview
  const items = activeOrder?.items || existingBill?.items || [];
  const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  let calculatedDiscountAmount = 0;
  if (discountType === 'percentage') {
    calculatedDiscountAmount = (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
  } else if (discountType === 'fixed') {
    calculatedDiscountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const taxableAmount = Math.max(0, subtotal - calculatedDiscountAmount);
  const cgstAmount = (taxableAmount * settings.cgstRate) / 100;
  const sgstAmount = (taxableAmount * settings.sgstRate) / 100;
  const serviceChargeAmount = settings.enableServiceCharge
    ? (taxableAmount * settings.serviceChargeRate) / 100
    : 0;

  const rawTotal = taxableAmount + cgstAmount + sgstAmount + serviceChargeAmount;
  const grandTotal = settings.enableRoundOff ? Math.round(rawTotal) : Math.round(rawTotal * 100) / 100;
  const roundOff = settings.enableRoundOff ? Math.round((grandTotal - rawTotal) * 100) / 100 : 0;

  const tenderedNumber = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNumber - grandTotal);

  // Edit item before printing handler
  const handleEditBillItem = (cartItem: CartItem) => {
    const found = menuItems.find(m => m.id === cartItem.menuItemId) || {
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
    setCustomizingMenuItem(found);
    sounds.playTap();
  };

  const handleUpdateBillItem = (updatedCartItem: CartItem) => {
    if (!selectedTableId) return;
    updateOrderItem(selectedTableId, updatedCartItem);
    setEditingCartItem(null);
    setCustomizingMenuItem(null);
    sounds.playTap();
  };

  // Handle Generate Bill
  const handleGenerateInvoice = () => {
    if (!selectedTableId) return;
    generateBill(selectedTableId, discountType, discountValue, discountReason, customerGstin);
    sounds.playTap();
  };

  // Handle Payment Settlement
  const handleSettle = () => {
    let billToSettle = existingBill;

    // If no bill generated yet, generate one on the fly
    if (!billToSettle && selectedTableId) {
      billToSettle = generateBill(selectedTableId, discountType, discountValue, discountReason, customerGstin);
    }

    if (!billToSettle) return;

    let paymentDetails: PaymentDetails;

    if (paymentMethod === 'cash') {
      paymentDetails = {
        method: 'cash',
        amount: grandTotal,
        cashTendered: tenderedNumber || grandTotal,
        changeGiven: changeDue,
      };
    } else if (paymentMethod === 'card') {
      paymentDetails = {
        method: 'card',
        amount: grandTotal,
        reference: cardAuthRef || 'VISA-CHIP-9842',
      };
    } else if (paymentMethod === 'upi') {
      paymentDetails = {
        method: 'upi',
        amount: grandTotal,
        reference: upiRef,
      };
    } else {
      // Split
      paymentDetails = {
        method: 'split',
        amount: grandTotal,
        splitBreakdown: {
          cash: splitCashAmount,
          upi: splitUpiAmount,
          card: splitCardAmount,
        },
      };
    }

    settlePayment(billToSettle.id, paymentDetails);

    // Reset inputs
    setDiscountType('none');
    setDiscountValue(0);
    setDiscountReason('');
    setCashTendered('');
  };

  const paidBills = bills.filter(b => b.status === 'paid');

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Header Controls */}
      <div className="bg-white border-b border-[#e5e7eb] px-5 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-[#1a1a1a]">
              Cashier & Billing Settlement
            </h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Tax invoices, instant multi-mode payments & receipts
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#f8f9fa] border border-[#e5e7eb] p-1 rounded-full">
          <button
            id="view-active-bills-btn"
            onClick={() => setActiveView('active')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeView === 'active'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            Active Tables ({billingEligibleTables.length})
          </button>
          <button
            id="view-paid-bills-btn"
            onClick={() => setActiveView('history')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeView === 'history'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            Settled History ({paidBills.length})
          </button>
        </div>
      </div>

      {activeView === 'active' ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Tables ready for bill */}
          <div className="w-72 lg:w-80 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0">
            <div className="p-3.5 border-b border-[#e5e7eb] bg-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                Occupied Tables
              </span>
              <span className="text-xs font-bold text-[#FF6321]">
                {billingEligibleTables.length} Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {billingEligibleTables.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No occupied tables with active orders.
                </div>
              ) : (
                billingEligibleTables.map(t => {
                  const isSelected = selectedTableId === t.id;
                  const ord = getTableOrder(t.id);
                  const fl = floors.find(f => f.id === t.floorId);

                  return (
                    <button
                      key={t.id}
                      id={`billing-table-card-${t.id}`}
                      onClick={() => {
                        setSelectedTableId(t.id);
                        sounds.playTap();
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-[#FF6321] bg-[#fff1eb]/30 shadow-xs ring-1 ring-[#FF6321]'
                          : 'border-[#e5e7eb] bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#1a1a1a]">{t.number}</span>
                          <span className="text-[10px] font-bold bg-[#f8f9fa] border border-[#e5e7eb] text-[#6b7280] px-1.5 py-0.2 rounded">
                            {fl?.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6b7280] mt-1 flex items-center gap-2">
                          <span>{t.guestCount || 2} Guests</span>
                          <span>•</span>
                          <span className="capitalize font-semibold text-orange-700">{t.status}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-sm text-[#1a1a1a]">
                          {formatCurrency(ord?.subtotal || 0)}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {ord?.items.length || 0} items
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Middle/Right Column: Interactive Invoice Builder & Payment Settlement */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#f3f4f6]">
            
            {/* Bill Details & Discounts */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              
              {/* Table Info Header */}
              <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black uppercase text-[#1a1a1a]">
                      Table {selectedTable?.number || 'T-??'}
                    </h3>
                    <span className="text-xs font-bold bg-[#fff1eb] text-[#FF6321] px-2 py-0.5 rounded-full border border-orange-200">
                      {floors.find(f => f.id === selectedTable?.floorId)?.name}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Waiter: <strong>{activeOrder?.waiterName || currentUser?.name}</strong> • Guests: {activeOrder?.guestCount || 2}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="trigger-split-bill-btn"
                    onClick={() => {
                      setSplitCashAmount(Math.round(grandTotal / 2));
                      setSplitUpiAmount(grandTotal - Math.round(grandTotal / 2));
                      setIsSplitModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e5e7eb] hover:bg-gray-50 text-xs font-bold text-[#1a1a1a] transition"
                  >
                    <Split className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Split Bill</span>
                  </button>

                  <button
                    id="print-estimate-bill-btn"
                    onClick={handleGenerateInvoice}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-black text-xs font-bold text-white shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill Slip</span>
                  </button>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-[#e5e7eb] bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    Order Items ({items.length})
                  </span>
                  <span className="text-xs font-bold text-[#1a1a1a]">
                    Subtotal: {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="divide-y divide-[#e5e7eb] text-xs">
                  {items.map((it, idx) => (
                    <div key={it.id || idx} className="p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50/80 transition">
                      <div className="flex items-start gap-2.5 min-w-[200px] flex-1">
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${it.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1a1a1a] text-sm">{it.name}</span>
                            {it.variant && (
                              <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                {it.variant.name}
                              </span>
                            )}
                          </div>
                          {(it.addons && it.addons.length > 0) || it.instructions || (it.spiceLevel && it.spiceLevel !== 'Medium') ? (
                            <div className="text-[11px] text-[#6b7280] font-medium mt-0.5 space-y-0.5">
                              {it.spiceLevel && it.spiceLevel !== 'Medium' && <span>Spice: {it.spiceLevel} • </span>}
                              {it.addons && it.addons.length > 0 && (
                                <span>+ {it.addons.map(a => a.name).join(', ')}</span>
                              )}
                              {it.instructions && (
                                <div className="text-amber-700 italic">Note: "{it.instructions}"</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Controls & Price */}
                      <div className="flex items-center gap-3">
                        {/* Edit Button */}
                        <button
                          type="button"
                          id={`bill-edit-item-btn-${idx}`}
                          onClick={() => handleEditBillItem(it)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fff1eb] border border-orange-200 hover:bg-orange-100 text-xs font-bold text-[#FF6321] transition cursor-pointer"
                          title="Edit quantity, size, add-ons or notes before printing"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white border border-[#e5e7eb] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => selectedTableId && updateOrderItemQuantity(selectedTableId, it.id, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center font-black text-[#1a1a1a] text-xs">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => selectedTableId && updateOrderItemQuantity(selectedTableId, it.id, 1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-black text-white cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5 text-[#FF6321]" />
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <div className="font-extrabold text-sm text-[#1a1a1a]">
                            {formatCurrency(it.price * it.quantity)}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {formatCurrency(it.price)} ea
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          id={`bill-remove-item-btn-${idx}`}
                          onClick={() => selectedTableId && removeOrderItem(selectedTableId, it.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remove item from bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Bill Adjustments */}
              <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Discounts & Adjustments</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('none');
                      setDiscountValue(0);
                      sounds.playTap();
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      discountType === 'none'
                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                        : 'bg-[#f8f9fa] text-[#1a1a1a] border-[#e5e7eb]'
                    }`}
                  >
                    No Discount
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('percentage');
                      setDiscountValue(10);
                      sounds.playTap();
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      discountType === 'percentage'
                        ? 'bg-[#FF6321] text-white border-[#FF6321]'
                        : 'bg-[#f8f9fa] text-[#1a1a1a] border-[#e5e7eb]'
                    }`}
                  >
                    Percentage (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountValue(100);
                      sounds.playTap();
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      discountType === 'fixed'
                        ? 'bg-[#FF6321] text-white border-[#FF6321]'
                        : 'bg-[#f8f9fa] text-[#1a1a1a] border-[#e5e7eb]'
                    }`}
                  >
                    Flat (₹)
                  </button>
                </div>

                {discountType !== 'none' && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6b7280] uppercase mb-1">
                        {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        id="discount-val-input"
                        value={discountValue || ''}
                        onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full rounded-xl border border-[#e5e7eb] p-2 text-xs font-bold text-[#1a1a1a] bg-[#f8f9fa]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6b7280] uppercase mb-1">
                        Reason / Note
                      </label>
                      <input
                        type="text"
                        id="discount-reason-input"
                        value={discountReason}
                        onChange={e => setDiscountReason(e.target.value)}
                        placeholder="e.g. Happy Hours, Courtesy, Staff"
                        className="w-full rounded-xl border border-[#e5e7eb] p-2 text-xs font-semibold text-[#1a1a1a] bg-[#f8f9fa]"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Settlement Pane: Payment Modes & Pay Now */}
            <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-[#e5e7eb] p-5 flex flex-col justify-between shrink-0 shadow-lg">
              
              <div className="space-y-4">
                
                {/* Grand Total Summary Box */}
                <div className="p-4 rounded-2xl bg-[#1a1a1a] text-white space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {calculatedDiscountAmount > 0 && (
                    <div className="flex justify-between text-xs text-[#FF6321] font-semibold">
                      <span>Discount</span>
                      <span>-{formatCurrency(calculatedDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Taxes (CGST {settings.cgstRate}% + SGST {settings.sgstRate}%)</span>
                    <span>{formatCurrency(cgstAmount + sgstAmount)}</span>
                  </div>

                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Service Charge ({settings.serviceChargeRate}%)</span>
                      <span>{formatCurrency(serviceChargeAmount)}</span>
                    </div>
                  )}

                  {roundOff !== 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Round Off</span>
                      <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-800">
                    <span className="uppercase">PAYABLE TOTAL</span>
                    <span className="text-[#FF6321]">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      id="pay-mode-cash-btn"
                      onClick={() => {
                        setPaymentMethod('cash');
                        sounds.playTap();
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === 'cash'
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] ring-1 ring-[#FF6321]'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-[#FF6321]" />
                      <span>CASH</span>
                    </button>

                    <button
                      type="button"
                      id="pay-mode-upi-btn"
                      onClick={() => {
                        setPaymentMethod('upi');
                        sounds.playTap();
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === 'upi'
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] ring-1 ring-[#FF6321]'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-[#FF6321]" />
                      <span>UPI QR</span>
                    </button>

                    <button
                      type="button"
                      id="pay-mode-card-btn"
                      onClick={() => {
                        setPaymentMethod('card');
                        sounds.playTap();
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === 'card'
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] ring-1 ring-[#FF6321]'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-[#FF6321]" />
                      <span>CARD</span>
                    </button>
                  </div>
                </div>

                {/* Specific Mode Inputs */}
                {paymentMethod === 'cash' && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#e5e7eb] space-y-2 text-xs">
                    <label className="block font-bold text-[#6b7280] uppercase tracking-wider text-[10px]">
                      Cash Tendered by Guest
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="cash-tendered-input"
                        value={cashTendered}
                        onChange={e => setCashTendered(e.target.value)}
                        placeholder={`e.g. ${Math.ceil(grandTotal / 500) * 500 || grandTotal}`}
                        className="w-full rounded-xl border border-[#e5e7eb] p-2.5 text-sm font-bold text-[#1a1a1a] bg-white focus:outline-hidden focus:border-[#FF6321]"
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="flex gap-1.5">
                      {[grandTotal, 500, 1000, 2000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashTendered(String(val))}
                          className="flex-1 py-1 bg-white border border-[#e5e7eb] rounded-lg text-[10px] font-bold text-[#1a1a1a] hover:bg-gray-100"
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>

                    {tenderedNumber > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-[#e5e7eb] text-xs">
                        <span className="font-bold text-[#6b7280]">Change to Return:</span>
                        <span className={`text-base font-black ${changeDue > 0 ? 'text-green-700' : 'text-[#1a1a1a]'}`}>
                          {formatCurrency(changeDue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="p-3.5 rounded-2xl bg-[#fff1eb]/40 border border-orange-200 text-center space-y-2 text-xs">
                    <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl border border-orange-200 shadow-xs flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <div className="font-black text-[#1a1a1a]">{formatCurrency(grandTotal)}</div>
                      <div className="text-[10px] text-gray-500 font-mono">UPI ID: urbanspice@icici</div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#e5e7eb] space-y-2 text-xs">
                    <label className="block font-bold text-[#6b7280] uppercase tracking-wider text-[10px]">
                      Card Auth Code / Last 4 Digits (Optional)
                    </label>
                    <input
                      type="text"
                      value={cardAuthRef}
                      onChange={e => setCardAuthRef(e.target.value)}
                      placeholder="e.g. HDFC-8821"
                      className="w-full rounded-xl border border-[#e5e7eb] p-2 text-xs font-semibold bg-white text-[#1a1a1a]"
                    />
                  </div>
                )}

              </div>

              {/* Big Settle & Print Receipt Action */}
              <div className="pt-4 border-t border-[#e5e7eb]">
                <button
                  id="settle-and-pay-btn"
                  disabled={items.length === 0}
                  onClick={handleSettle}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] hover:bg-black active:scale-98 text-white font-black py-4 text-xs uppercase tracking-widest transition disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#FF6321]" />
                  <span>SETTLE & PRINT RECEIPT ({formatCurrency(grandTotal)})</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* Settled History View */
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                Paid Invoices & Receipts Today
              </h3>
              <span className="text-xs font-bold text-[#1a1a1a]">
                Total Settled: {formatCurrency(paidBills.reduce((s, b) => s + b.grandTotal, 0))}
              </span>
            </div>

            <div className="divide-y divide-[#e5e7eb] bg-white rounded-2xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
              {paidBills.map(bill => (
                <div key={bill.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#1a1a1a]">{bill.invoiceNumber}</span>
                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        PAID ✓
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6b7280] mt-0.5">
                      Table {bill.tableNumber} • Waiter: {bill.waiterName} • Paid at: {formatTime(bill.paidAt || bill.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-black text-sm text-[#1a1a1a]">{formatCurrency(bill.grandTotal)}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">
                        Via {bill.payment?.method || 'Cash'}
                      </div>
                    </div>

                    <button
                      onClick={() => reprintBill(bill.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] text-[#1a1a1a] font-bold text-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reprint</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <Split className="w-5 h-5 text-[#FF6321]" />
                <h3 className="font-extrabold text-[#1a1a1a] text-base">Split Bill & Mixed Payments</h3>
              </div>
              <button onClick={() => setIsSplitModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#fff1eb] border border-orange-200 rounded-2xl text-[#1a1a1a] flex justify-between items-center">
                <span>Total Bill Amount:</span>
                <span className="font-black text-sm text-[#FF6321]">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Mode: Equal or Custom */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`p-2.5 rounded-xl font-bold border transition ${
                    splitType === 'equal' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 text-[#1a1a1a] border-[#e5e7eb]'
                  }`}
                >
                  Equal Split (by People)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`p-2.5 rounded-xl font-bold border transition ${
                    splitType === 'custom' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 text-[#1a1a1a] border-[#e5e7eb]'
                  }`}
                >
                  Custom Mixed Amounts
                </button>
              </div>

              {splitType === 'equal' ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1a1a1a]">Number of Guests:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSplitGuestCount(Math.max(2, splitGuestCount - 1))}
                        className="w-7 h-7 rounded-lg bg-gray-100 border border-[#e5e7eb] font-bold"
                      >
                        -
                      </button>
                      <span className="font-black text-sm">{splitGuestCount}</span>
                      <button
                        onClick={() => setSplitGuestCount(splitGuestCount + 1)}
                        className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-[#e5e7eb] text-center">
                    <span className="text-[11px] text-gray-500 block">Each Person Pays:</span>
                    <span className="text-xl font-black text-[#1a1a1a]">
                      {formatCurrency(Math.round(grandTotal / splitGuestCount))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">Cash Amount (₹)</label>
                    <input
                      type="number"
                      value={splitCashAmount || ''}
                      onChange={e => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#e5e7eb] rounded-xl font-bold bg-[#f8f9fa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">UPI Amount (₹)</label>
                    <input
                      type="number"
                      value={splitUpiAmount || ''}
                      onChange={e => setSplitUpiAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#e5e7eb] rounded-xl font-bold bg-[#f8f9fa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">Card Amount (₹)</label>
                    <input
                      type="number"
                      value={splitCardAmount || ''}
                      onChange={e => setSplitCardAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#e5e7eb] rounded-xl font-bold bg-[#f8f9fa]"
                    />
                  </div>

                  <div className="flex justify-between font-bold pt-2 border-t border-[#e5e7eb]">
                    <span>Allocated: {formatCurrency(splitCashAmount + splitUpiAmount + splitCardAmount)}</span>
                    <span className={splitCashAmount + splitUpiAmount + splitCardAmount === grandTotal ? 'text-green-600' : 'text-rose-600'}>
                      Remaining: {formatCurrency(grandTotal - (splitCashAmount + splitUpiAmount + splitCardAmount))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('split');
                  setIsSplitModalOpen(false);
                  sounds.playTap();
                }}
                className="px-5 py-2 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply Split Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Customizer / Edit Modal before printing */}
      {customizingMenuItem && editingCartItem && (
        <ItemCustomizerModal
          item={customizingMenuItem}
          isOpen={!!customizingMenuItem}
          initialCartItem={editingCartItem}
          onClose={() => {
            setCustomizingMenuItem(null);
            setEditingCartItem(null);
          }}
          onAddToCart={handleUpdateBillItem}
          onUpdateCartItem={handleUpdateBillItem}
        />
      )}

    </div>
  );
};
