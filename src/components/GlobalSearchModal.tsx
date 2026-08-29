import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { Search, X, UtensilsCrossed, BookOpen, Receipt, FileText, User, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { sounds } from '../utils/audio';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (tableId: string) => void;
  onSelectBill: (billId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  onSelectBill,
}) => {
  const { tables, menuItems, kots, bills, floors } = usePos();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Filter Tables
  const matchedTables = cleanQuery
    ? tables.filter(
        t =>
          t.number.toLowerCase().includes(cleanQuery) ||
          t.customerName?.toLowerCase().includes(cleanQuery) ||
          t.customerPhone?.includes(cleanQuery)
      )
    : [];

  // Filter Menu Items
  const matchedMenuItems = cleanQuery
    ? menuItems.filter(
        m =>
          m.name.toLowerCase().includes(cleanQuery) ||
          m.shortCode?.toLowerCase().includes(cleanQuery) ||
          m.description?.toLowerCase().includes(cleanQuery)
      )
    : [];

  // Filter KOTs
  const matchedKots = cleanQuery
    ? kots.filter(
        k =>
          k.kotNumber.toString().includes(cleanQuery) ||
          k.tableNumber.toLowerCase().includes(cleanQuery) ||
          k.items.some(i => i.name.toLowerCase().includes(cleanQuery))
      )
    : [];

  // Filter Bills
  const matchedBills = cleanQuery
    ? bills.filter(
        b =>
          b.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          b.tableNumber.toLowerCase().includes(cleanQuery) ||
          b.customerName?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = matchedTables.length + matchedMenuItems.length + matchedKots.length + matchedBills.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#e5e7eb] px-5 py-4 bg-[#f8f9fa]">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type table # (e.g. T-12), dish name (e.g. Biryani), KOT #1048, or invoice..."
            className="w-full text-sm font-semibold text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-[#1a1a1a] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-xl bg-white border border-[#e5e7eb] px-2.5 py-1 text-xs font-black text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          
          {cleanQuery && totalResults === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No matching tables, menu items, KOTs, or invoices found for "{query}".
            </div>
          )}

          {!cleanQuery && (
            <div className="py-8 text-center text-xs text-[#6b7280]">
              <p className="font-bold text-[#1a1a1a] mb-1">Instant Restaurant Search</p>
              <p>Type anything to instantly locate tables, dishes, active orders, and historical bills.</p>
            </div>
          )}

          {/* Tables */}
          {matchedTables.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-2 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF6321]" />
                <span>Tables ({matchedTables.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchedTables.map(t => {
                  const floor = floors.find(f => f.id === t.floorId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTable(t.id);
                        onClose();
                        sounds.playTap();
                      }}
                      className="p-2.5 rounded-2xl border border-[#e5e7eb] hover:border-[#FF6321] hover:bg-[#fff1eb]/40 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-black text-sm text-[#1a1a1a]">{t.number}</div>
                        <div className="text-[11px] text-[#6b7280]">{floor?.name}</div>
                        <div className="text-[10px] capitalize font-bold text-[#FF6321] mt-0.5">{t.status}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Items */}
          {matchedMenuItems.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-green-600" />
                <span>Menu Items ({matchedMenuItems.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedMenuItems.map(m => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <span className="font-bold text-[#1a1a1a]">{m.name}</span>
                        {m.shortCode && <span className="ml-1.5 text-[10px] bg-white border border-[#e5e7eb] px-1 py-0.2 rounded font-mono font-bold text-[#6b7280]">{m.shortCode}</span>}
                        {m.description && <p className="text-[11px] text-[#6b7280] line-clamp-1">{m.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[#1a1a1a]">{formatCurrency(m.price)}</span>
                      <div>
                        <span className={`text-[10px] font-bold ${m.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {m.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KOTs */}
          {matchedKots.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FF6321]" />
                <span>KOTs ({matchedKots.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedKots.map(k => (
                  <div
                    key={k.id}
                    className="p-2.5 rounded-2xl bg-[#fff1eb]/40 border border-orange-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#1a1a1a]">
                        KOT #{k.kotNumber} • Table {k.tableNumber}
                      </div>
                      <div className="text-[11px] text-[#6b7280]">
                        Waiter: {k.waiterName} • {k.items.length} items
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[#fff1eb] text-[#FF6321] border border-orange-200 px-2 py-0.5 rounded-md">
                      {k.printStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bills */}
          {matchedBills.length > 0 && (
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280] mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#FF6321]" />
                <span>Invoices & Bills ({matchedBills.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedBills.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectBill(b.id);
                      onClose();
                      sounds.playTap();
                    }}
                    className="w-full p-2.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] hover:border-[#FF6321] text-left flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-[#1a1a1a]">{b.invoiceNumber}</div>
                      <div className="text-[11px] text-[#6b7280]">
                        Table {b.tableNumber} • {b.customerName || 'Dine-in'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-[#1a1a1a]">{formatCurrency(b.grandTotal)}</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
