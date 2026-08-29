import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { InventoryItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Boxes,
  AlertTriangle,
  Plus,
  ArrowDownRight,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const InventoryPage: React.FC = () => {
  const { inventory, updateInventoryStock, addInventoryAdjustment } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'purchase' | 'wastage' | 'count_adjustment'>('purchase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock);
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdjustment = (item: InventoryItem, type: 'purchase' | 'wastage' | 'count_adjustment') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(type === 'purchase' ? 10 : 2);
    setAdjustmentReason(type === 'purchase' ? 'Daily vendor purchase delivery' : 'Kitchen prep wastage');
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || adjustmentQuantity <= 0) return;

    let delta = adjustmentQuantity;
    if (adjustmentType === 'wastage') {
      delta = -Math.abs(adjustmentQuantity);
    }

    addInventoryAdjustment(selectedItem.id, delta, adjustmentType, adjustmentReason);
    sounds.playPaymentSuccess();
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">
              Kitchen Inventory & Raw Material Stocks
            </h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Ingredient stock levels, vendor purchase in, wastage logging, and minimum threshold alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#6b7280] block">Total Stock Valuation</span>
            <span className="text-base font-black text-[#1a1a1a]">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">Total Tracked Items</span>
          <div className="text-xl font-black text-[#1a1a1a] mt-1">{inventory.length} SKUs</div>
          <span className="text-[10px] text-gray-400">Dairy, Poultry, Vegetables, Beverages</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span className="text-[11px] font-bold uppercase">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-black text-red-600 mt-1">{lowStockItems.length} SKUs</div>
          <span className="text-[10px] text-red-500 font-semibold">Immediate reorder required</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">Automated Deductions</span>
          <div className="text-xl font-black text-green-600 mt-1">Active ✓</div>
          <span className="text-[10px] text-gray-400">Stock updates when orders are settled</span>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-bold text-red-950">
              Low Stock Alert on {lowStockItems.map(i => i.name).join(', ')}.
            </span>
          </div>
          <span className="text-[11px] font-bold text-red-700">Restock via Vendor Purchase In</span>
        </div>
      )}

      {/* Stock Table & Search */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ingredient, dairy, meat, spices..."
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl focus:bg-white focus:border-[#FF6321] focus:outline-hidden text-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[10px] font-extrabold uppercase tracking-wider text-[#6b7280]">
              <tr>
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min. Threshold</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4 text-right">Quick Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] font-medium text-[#1a1a1a]">
              {filteredInventory.map(item => {
                const isLow = item.currentStock <= item.minStock;
                const lineVal = item.currentStock * item.unitCost;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4 font-bold text-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        {isLow && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280]">{item.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-black ${isLow ? 'text-red-600 font-black' : 'text-[#1a1a1a]'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280]">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280]">
                      {formatCurrency(item.unitCost)} / {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1a1a1a]">
                      {formatCurrency(lineVal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustment(item, 'purchase')}
                          className="px-2.5 py-1 bg-[#1a1a1a] text-white hover:bg-black rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#FF6321]" />
                          <span>Purchase In</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjustment(item, 'wastage')}
                          className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <TrendingDown className="w-3 h-3" />
                          <span>Log Wastage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <h3 className="font-extrabold text-[#1a1a1a] text-base">
                {adjustmentType === 'purchase' ? 'Log Purchase Delivery' : 'Log Ingredient Wastage'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div className="p-3 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#6b7280] block">Item</span>
                <span className="font-extrabold text-sm text-[#1a1a1a]">{selectedItem.name}</span>
                <span className="text-[#6b7280] ml-2">(Current: {selectedItem.currentStock} {selectedItem.unit})</span>
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1">
                  Quantity ({selectedItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={adjustmentQuantity}
                  onChange={e => setAdjustmentQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-bold text-sm text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1">
                  Reason / Vendor Reference
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Metro Cash & Carry Invoice #9842"
                  className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-[#6b7280]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#1a1a1a] hover:bg-black cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
