import React, { useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency, isToday } from '../utils/formatters';
import {
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  Clock,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ShoppingBag,
  Layers,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface DashboardPageProps {
  onNavigateTab: (tab: any, tableId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const {
    tables,
    bills,
    kots,
    inventory,
    floors,
    menuItems,
    orders,
    currentBranch,
    settings,
  } = usePos();

  // All dashboard metrics are explicitly scoped to the current local calendar day.
  // Sales use paidAt (when the money was actually settled), falling back to createdAt.
  const todayBills = useMemo(
    () => bills.filter(b => isToday(b.paidAt || b.createdAt)),
    [bills]
  );
  const paidBillsToday = useMemo(
    () => todayBills.filter(b => b.status === 'paid'),
    [todayBills]
  );

  const todayOrders = useMemo(
    () => orders.filter(o => isToday(o.createdAt) && o.status !== 'cancelled'),
    [orders]
  );

  const totalSalesToday = useMemo(() => {
    return paidBillsToday.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [paidBillsToday]);

  const occupiedTables = useMemo(() => {
    return tables.filter(t => t.status === 'occupied' || t.status === 'ordering');
  }, [tables]);

  const billingTables = useMemo(() => {
    return tables.filter(t => t.status === 'billing');
  }, [tables]);

  const availableTables = useMemo(() => {
    return tables.filter(t => t.status === 'available');
  }, [tables]);

  const totalOrdersCount = todayOrders.length;
  const avgOrderValue = paidBillsToday.length > 0 ? Math.round(totalSalesToday / paidBillsToday.length) : 0;

  // Real top-selling items ordered today, based on today's orders only.
  const topSelling = useMemo(() => {
    const itemMap = new Map<string, { name: string; count: number; revenue: number; isVeg: boolean }>();

    todayOrders.forEach(order => {
      order.items.forEach(it => {
        const existing = itemMap.get(it.menuItemId) || {
          name: it.name,
          count: 0,
          revenue: 0,
          isVeg: it.isVeg ?? true,
        };
        existing.count += it.quantity;
        existing.revenue += it.price * it.quantity;
        itemMap.set(it.menuItemId, existing);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [todayOrders]);

  // Hourly sales dynamically grouped by hour
  const hourlyData = useMemo(() => {
    const hours = ['11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'];
    const distribution = hours.map(h => ({ hour: h, amount: 0 }));

    paidBillsToday.forEach(bill => {
      const date = new Date(bill.paidAt || bill.createdAt);
      const hourNum = date.getHours();
      let label = `${hourNum % 12 || 12} ${hourNum >= 12 ? 'PM' : 'AM'}`;
      const found = distribution.find(d => d.hour === label);
      if (found) {
        found.amount += bill.grandTotal;
      }
    });

    return distribution;
  }, [paidBillsToday]);

  const maxHourly = Math.max(...hourlyData.map(h => h.amount), 100);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner / Restaurant Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tight">
              {settings.name || 'Prawar POS'}
            </h2>
            <span className="text-xs font-bold bg-[#fff1eb] text-[#FF6321] px-2.5 py-0.5 rounded-full border border-orange-200">
              {currentBranch.name}
            </span>
          </div>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">
            Live operational telemetry, table occupancy & thermal print dispatch status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="quick-goto-pos-btn"
            onClick={() => {
              onNavigateTab('pos-tables');
              sounds.playTap();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF6321]" />
            <span>Open Table POS</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sales */}
        <div className="p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              Today's Net Sales
            </span>
            <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#1a1a1a]">{formatCurrency(totalSalesToday)}</h3>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#6b7280] font-semibold">
              <span>{paidBillsToday.length} Settled Bills Today</span>
            </div>
          </div>
        </div>

        {/* Orders & Bills */}
        <div className="p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              Total Orders Today
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6321]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#1a1a1a]">{totalOrdersCount}</h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6b7280] font-medium">
              <span>Avg Ticket: <strong>{formatCurrency(avgOrderValue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Live Active Tables */}
        <div className="p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              Live Occupancy
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6321]">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#1a1a1a]">
              {occupiedTables.length} / {tables.length}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6b7280]">
              <span className="text-green-600 font-bold">{availableTables.length} Free</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">{billingTables.length} Billing</span>
            </div>
          </div>
        </div>

        {/* KOT Slips & Print State */}
        <div className="p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
              Kitchen KOT Slips
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#1a1a1a]">{kots.filter(k => isToday(k.createdAt)).length}</h3>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-green-700 font-bold">
              <span>{kots.some(k => isToday(k.createdAt)) ? 'Dispatched to Kitchen Today' : 'No slips sent today'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Occupancy Map & Live Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Floor Wise Table Occupancy */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">
                Live Table Status
              </h3>
              <p className="text-xs text-[#6b7280]">Real-time floor map & quick table jump</p>
            </div>
            <button
              onClick={() => onNavigateTab('pos-tables')}
              className="text-xs font-bold text-[#FF6321] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Floor View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Table Dots Grid */}
          {tables.length === 0 ? (
            <div className="p-8 text-center bg-[#f8f9fa] rounded-2xl border border-dashed border-[#e5e7eb] text-xs text-gray-400">
              No tables configured yet. Open the POS screen to add tables.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {floors.map(fl => {
                const floorTables = tables.filter(t => t.floorId === fl.id);
                if (floorTables.length === 0) return null;

                return (
                  <div key={fl.id} className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb]">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase text-[#1a1a1a]">{fl.name}</span>

                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {floorTables.map(t => {
                        const isOccupied = t.status === 'occupied' || t.status === 'ordering';
                        const isBilling = t.status === 'billing';

                        return (
                          <button
                            key={t.id}
                            onClick={() => onNavigateTab('pos-tables', t.id)}
                            className={`p-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                              isOccupied
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : isBilling
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-[#e5e7eb] hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <span className="font-extrabold text-xs">{t.number}</span>

                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hourly Trend Chart & Top Selling Dishes */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Hourly Trend Simple Bar Chart */}
          <div className="bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">
                Today's Sales Trend
              </h3>
              <span className="text-xs font-bold text-[#FF6321]">
                Total: {formatCurrency(totalSalesToday)}
              </span>
            </div>

            <div className="h-36 flex items-end justify-between gap-1.5 pt-4 px-2">
              {hourlyData.map((d, i) => {
                const heightPercent = totalSalesToday > 0 ? Math.max(8, (d.amount / maxHourly) * 100) : 6;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all relative ${
                        d.amount > 0 ? 'bg-[#FF6321] group-hover:bg-[#1a1a1a]' : 'bg-gray-200'
                      }`}
                    >
                      {d.amount > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1a1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                          {formatCurrency(d.amount)}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center">
                      {d.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Dishes */}
          <div className="bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">
                Top Ordered Dishes Today
              </h3>
              <span className="text-[11px] text-[#6b7280] font-semibold">Real Data</span>
            </div>

            {topSelling.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 bg-[#f8f9fa] rounded-2xl border border-dashed border-[#e5e7eb]">
                No dishes ordered yet today.
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7eb] text-xs">
                {topSelling.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${it.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-bold text-[#1a1a1a]">{it.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium">{it.count} ordered</span>
                      <span className="font-black text-[#1a1a1a]">{formatCurrency(it.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
