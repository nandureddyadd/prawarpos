import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Table } from '../types';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TableTransferModalProps {
  sourceTable: Table;
  isOpen: boolean;
  onClose: () => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  sourceTable,
  isOpen,
  onClose,
}) => {
  const { tables, floors, transferTable } = usePos();
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Available candidate tables (must be 'available' or 'reserved')
  const candidateTables = tables.filter(
    t => t.id !== sourceTable.id && (t.status === 'available' || t.status === 'reserved')
  );

  const handleTransfer = () => {
    if (!targetTableId) {
      setError('Please select a destination table.');
      return;
    }

    const success = transferTable(sourceTable.id, targetTableId);
    if (success) {
      sounds.playPaymentSuccess();
      onClose();
    } else {
      setError('Failed to transfer table. Destination may no longer be available.');
    }
  };

  const sourceFloor = floors.find(f => f.id === sourceTable.floorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1a1a1a] text-base">Transfer Table Order</h3>
              <p className="text-xs text-[#6b7280] font-semibold">
                Move Table {sourceTable.number} ({sourceFloor?.name})
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
            All active items, KOT history, guest count, and waiter assignment will be transferred automatically.
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px] mb-2">
              Select Destination Table (Available Only)
            </label>

            {candidateTables.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                No available tables found on any floor to transfer to.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {candidateTables.map(t => {
                  const fl = floors.find(f => f.id === t.floorId);
                  const isSelected = targetTableId === t.id;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetTableId(t.id);
                        setError('');
                        sounds.playTap();
                      }}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] font-bold'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-black">{t.number}</div>
                      <div className="text-[10px] text-[#6b7280] truncate">{fl?.name}</div>
                      <div className="text-[10px] font-bold text-green-600 mt-1">Available</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] bg-[#f8f9fa] p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-[#6b7280] hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!targetTableId}
            className="rounded-xl bg-[#1a1a1a] hover:bg-black px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
          >
            Confirm Transfer
          </button>
        </div>

      </div>
    </div>
  );
};
