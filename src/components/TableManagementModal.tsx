import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Table, Floor } from '../types';
import { X, Plus, Trash2, Edit2, Layers, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFloorId?: string;
}

export const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  onClose,
  initialFloorId,
}) => {
  const { floors, tables, addFloor, deleteFloor, addTable, updateTable, deleteTable } = usePos();
  
  const [activeTab, setActiveTab] = useState<'tables' | 'floors'>('tables');

  // New Table Form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableFloorId, setNewTableFloorId] = useState(initialFloorId && initialFloorId !== 'all' ? initialFloorId : floors[0]?.id || '');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // New Floor Form state
  const [newFloorName, setNewFloorName] = useState('');

  // Editing state
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  if (!isOpen) return null;

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim() || !newTableFloorId) {
      sounds.playAlert();
      return;
    }

    if (editingTable) {
      updateTable({
        ...editingTable,
        number: newTableNumber.trim(),
        floorId: newTableFloorId,
        capacity: Number(newTableCapacity) || 4,
      });
      setEditingTable(null);
    } else {
      addTable({
        number: newTableNumber.trim(),
        floorId: newTableFloorId,
        capacity: Number(newTableCapacity) || 4,
        status: 'available',
      });
    }

    setNewTableNumber('');
    setNewTableCapacity(4);
    sounds.playPaymentSuccess();
  };

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) {
      sounds.playAlert();
      return;
    }

    const createdFloor = addFloor(newFloorName.trim());
    setNewFloorName('');
    if (!newTableFloorId) {
      setNewTableFloorId(createdFloor.id);
    }
    sounds.playPaymentSuccess();
  };

  const handleStartEditTable = (table: Table) => {
    setEditingTable(table);
    setNewTableNumber(table.number);
    setNewTableFloorId(table.floorId);
    setNewTableCapacity(table.capacity);
  };

  const handleCancelEdit = () => {
    setEditingTable(null);
    setNewTableNumber('');
    setNewTableCapacity(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1a1a1a]">Floors & Tables Management</h3>
              <p className="text-xs text-[#6b7280]">Configure your restaurant seating layout and areas</p>
            </div>
          </div>

          <button
            id="close-table-mgmt-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e5e7eb] bg-white px-6">
          <button
            type="button"
            id="tab-mgmt-tables-btn"
            onClick={() => setActiveTab('tables')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'tables'
                ? 'border-[#FF6321] text-[#FF6321]'
                : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            Tables ({tables.length})
          </button>
          <button
            type="button"
            id="tab-mgmt-floors-btn"
            onClick={() => setActiveTab('floors')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'floors'
                ? 'border-[#FF6321] text-[#FF6321]'
                : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            Floors ({floors.length})
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'tables' && (
            <div className="space-y-6">
              
              {/* Add / Edit Table Form */}
              <form onSubmit={handleAddTable} className="bg-[#f8f9fa] p-4 rounded-2xl border border-[#e5e7eb] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
                    {editingTable ? `Edit Table: ${editingTable.number}` : '+ Add New Table'}
                  </h4>
                  {editingTable && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] font-bold text-gray-500 hover:text-[#1a1a1a] cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#6b7280] mb-1">
                      Table Number / Name *
                    </label>
                    <input
                      type="text"
                      id="input-table-number"
                      value={newTableNumber}
                      onChange={e => setNewTableNumber(e.target.value)}
                      placeholder="e.g. T-01, T-12, Table 4"
                      className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#FF6321]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#6b7280] mb-1">
                      Floor / Section *
                    </label>
                    {floors.length === 0 ? (
                      <div className="text-[11px] font-bold text-amber-700 p-2 bg-amber-50 rounded-xl border border-amber-200">
                        Create a floor first
                      </div>
                    ) : (
                      <select
                        id="select-table-floor"
                        value={newTableFloorId}
                        onChange={e => setNewTableFloorId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#FF6321]"
                        required
                      >
                        {floors.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#6b7280] mb-1">
                      Seating Capacity (Seats)
                    </label>
                    <input
                      type="number"
                      id="input-table-capacity"
                      value={newTableCapacity}
                      onChange={e => setNewTableCapacity(Number(e.target.value))}
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#FF6321]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    id="submit-table-btn"
                    disabled={floors.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    {editingTable ? <Check className="w-3.5 h-3.5 text-[#FF6321]" /> : <Plus className="w-3.5 h-3.5 text-[#FF6321]" />}
                    <span>{editingTable ? 'Save Table Changes' : 'Add Table'}</span>
                  </button>
                </div>
              </form>

              {/* Tables List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                  Existing Tables ({tables.length})
                </h4>

                {tables.length === 0 ? (
                  <div className="p-8 text-center bg-[#f8f9fa] rounded-2xl border border-dashed border-[#e5e7eb] text-gray-400 font-medium text-xs">
                    No tables added yet. Fill the form above to add your first table.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tables.map(table => {
                      const floorName = floors.find(f => f.id === table.floorId)?.name || 'Unknown Floor';
                      return (
                        <div
                          key={table.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs hover:border-[#FF6321] transition"
                        >
                          <div>
                            <span className="text-sm font-black text-[#1a1a1a]">{table.number}</span>
                            <div className="text-[11px] text-[#6b7280] font-medium">
                              {table.capacity} Seats • {floorName}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditTable(table)}
                              className="p-1.5 text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Edit Table"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTable(table.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Table"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'floors' && (
            <div className="space-y-6">
              
              {/* Add Floor Form */}
              <form onSubmit={handleAddFloor} className="bg-[#f8f9fa] p-4 rounded-2xl border border-[#e5e7eb] space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
                  + Add New Floor / Area
                </h4>

                <div className="flex gap-3">
                  <input
                    type="text"
                    id="input-floor-name"
                    value={newFloorName}
                    onChange={e => setNewFloorName(e.target.value)}
                    placeholder="e.g. Ground Floor, Main Hall, Rooftop, Garden Patio, AC Hall"
                    className="flex-1 px-3.5 py-2 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#FF6321]"
                    required
                  />
                  <button
                    type="submit"
                    id="submit-floor-btn"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Add Floor</span>
                  </button>
                </div>
              </form>

              {/* Floors List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                  Configured Floors ({floors.length})
                </h4>

                {floors.length === 0 ? (
                  <div className="p-8 text-center bg-[#f8f9fa] rounded-2xl border border-dashed border-[#e5e7eb] text-gray-400 font-medium text-xs">
                    No floors added yet. Add your restaurant sections (e.g. Ground Floor, AC Room, Rooftop).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {floors.map(floor => {
                      const count = tables.filter(t => t.floorId === floor.id).length;
                      return (
                        <div
                          key={floor.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#fff1eb] text-[#FF6321] flex items-center justify-center font-black text-xs">
                              {floor.order}
                            </div>
                            <div>
                              <span className="text-sm font-black text-[#1a1a1a]">{floor.name}</span>
                              <p className="text-[11px] text-[#6b7280] font-medium">{count} Tables assigned</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteFloor(floor.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Delete Floor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
