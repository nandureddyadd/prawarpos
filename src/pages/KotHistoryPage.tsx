import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { formatTime, formatDate } from '../utils/formatters';
import { Printer, Search, RefreshCw, Filter, CheckCircle2, Clock, UtensilsCrossed } from 'lucide-react';
import { sounds } from '../utils/audio';

export const KotHistoryPage: React.FC = () => {
  const { kots, reprintKot } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWaiter, setFilterWaiter] = useState('all');

  const waitersList = useMemo(() => {
    const set = new Set<string>();
    kots.forEach(k => set.add(k.waiterName));
    return Array.from(set);
  }, [kots]);

  const filteredKots = useMemo(() => {
    return kots.filter(kot => {
      if (filterWaiter !== 'all' && kot.waiterName !== filterWaiter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = kot.kotNumber.toString().includes(q);
        const matchTable = kot.tableNumber.toLowerCase().includes(q);
        const matchItem = kot.items.some(i => i.name.toLowerCase().includes(q));
        if (!matchNum && !matchTable && !matchItem) return false;
      }
      return true;
    });
  }, [kots, filterWaiter, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">
              Physical KOT Slips & Kitchen Routing
            </h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Real-time audit of all printed kitchen order tickets (No KDS required).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#1a1a1a] text-white px-3 py-1.5 rounded-full">
            {kots.length} KOTs Dispatched Today
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e5e7eb]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by KOT # (e.g. 1049), Table # (e.g. T-12), or dish name..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-[#1a1a1a] bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterWaiter}
            onChange={e => setFilterWaiter(e.target.value)}
            className="text-xs font-bold text-[#1a1a1a] bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="all">All Waiters</option>
            {waitersList.map(w => (
              <option key={w} value={w}>Waiter: {w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KOT Slips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredKots.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400">
            No KOT records match the current search filters.
          </div>
        ) : (
          filteredKots.map(kot => (
            <div
              key={kot.id}
              className="p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Top info */}
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#1a1a1a]">KOT #{kot.kotNumber}</span>
                    <span className="text-[10px] font-bold bg-[#fff1eb] text-[#FF6321] px-2 py-0.5 rounded-full border border-orange-200 uppercase">
                      Table {kot.tableNumber}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    PRINTED ✓
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6b7280] mt-2 font-medium">
                  <span>Waiter: <strong>{kot.waiterName}</strong></span>
                  <span>{formatTime(kot.createdAt)}</span>
                </div>

                {kot.notes && (
                  <div className="mt-2.5 p-2 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] text-orange-950 font-medium">
                    Note: "{kot.notes}"
                  </div>
                )}

                {/* Items in this KOT */}
                <div className="mt-3 space-y-1.5 pt-2 border-t border-dashed border-[#e5e7eb]">
                  {kot.items.map((it, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs">
                      <div className="flex items-start gap-1.5 flex-1 pr-2">
                        <span className="font-extrabold text-[#1a1a1a] w-5">{it.quantity}×</span>
                        <div>
                          <span className="font-bold text-[#1a1a1a]">{it.name}</span>
                          {it.instructions && (
                            <span className="block text-[10px] text-gray-400 italic">
                              ({it.instructions})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">
                  {kot.items.reduce((s, i) => s + i.quantity, 0)} Total Dishes
                </span>

                <button
                  onClick={() => {
                    reprintKot(kot.id);
                    sounds.playTap();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF6321]" />
                  <span>Reprint KOT Slip</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
