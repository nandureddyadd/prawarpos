import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Table } from '../types';
import { X, Merge, Check, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TableMergeModalProps {
  primaryTable: Table;
  isOpen: boolean;
  onClose: () => void;
}

export const TableMergeModal: React.FC<TableMergeModalProps> = ({
  primaryTable,
  isOpen,
  onClose,
}) => {
  const { tables, floors, mergeTables } = usePos();
  const [selectedSourceTableIds, setSelectedSourceTableIds] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Candidate tables with active occupied orders (excluding primary table)
  const candidateTables = tables.filter(
    t => t.id !== primaryTable.id && (t.status === 'occupied' || t.status === 'ordering' || t.status === 'billing')
  );

  const toggleTableSelect = (tId: string) => {
    setSelectedSourceTableIds(prev =>
      prev.includes(tId) ? prev.filter(id => id !== tId) : [...prev, tId]
    );
    sounds.playTap();
  };

  const handleMerge = () => {
    if (selectedSourceTableIds.length === 0) {
      setError('Please select at least one occupied table to merge.');
      return;
    }

    const success = mergeTables(selectedSourceTableIds, primaryTable.id);
    if (success) {
      sounds.playPaymentSuccess();
      onClose();
    } else {
      setError('Failed to merge tables.');
    }
  };

  const primaryFloor = floors.find(f => f.id === primaryTable.floorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
              <Merge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1a1a1a] text-base">Merge Tables & Orders</h3>
              <p className="text-xs text-[#6b7280] font-semibold">
                Target Master Table: {primaryTable.number} ({primaryFloor?.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          <div className="p-3 bg-[#fff1eb] border border-orange-200 rounded-2xl text-[#1a1a1a] leading-relaxed font-medium">
            Select other occupied tables to combine into <strong>Table {primaryTable.number}</strong>. All orders, items, and KOTs will be united into one single order.
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px] mb-2">
              Select Occupied Tables to Merge In
            </label>

            {candidateTables.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                No other occupied tables available to merge with.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {candidateTables.map(t => {
                  const fl = floors.find(f => f.id === t.floorId);
                  const isSelected = selectedSourceTableIds.includes(t.id);

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTableSelect(t.id)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] font-bold'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-black">{t.number}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6321] font-black" />}
                      </div>
                      <div className="text-[10px] text-[#6b7280] truncate">{fl?.name}</div>
                      <div className="text-[10px] font-bold text-[#FF6321] mt-1 capitalize">{t.status}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8f9fa] p-4">
          <span className="text-[#6b7280] font-semibold">
            {selectedSourceTableIds.length} table(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-[#6b7280] hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMerge}
              disabled={selectedSourceTableIds.length === 0}
              className="rounded-xl bg-[#1a1a1a] hover:bg-black px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              Merge into Table {primaryTable.number}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
