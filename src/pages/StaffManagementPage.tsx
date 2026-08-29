import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { StaffUser, UserRole } from '../types';
import {
  Users,
  Plus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const StaffManagementPage: React.FC = () => {
  const { staff, floors, tables, addStaffMember, updateStaffMember, deleteStaffMember, currentUser } = usePos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  const [formData, setFormData] = useState<Partial<StaffUser>>({
    name: '',
    email: '',
    role: 'waiter',
    pin: '1234',
    phone: '',
    active: true,
    assignedTables: [],
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      role: 'waiter',
      pin: '1234',
      phone: '',
      active: true,
      assignedTables: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: StaffUser) => {
    setEditingStaff(user);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    if (editingStaff) {
      updateStaffMember(editingStaff.id, formData);
    } else {
      const newUser: StaffUser = {
        id: `staff-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole,
        pin: formData.pin || '1234',
        phone: formData.phone,
        active: formData.active ?? true,
        assignedTables: formData.assignedTables || [],
        createdAt: new Date().toISOString(),
      };
      addStaffMember(newUser);
    }

    sounds.playPaymentSuccess();
    setIsModalOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'OWNER', bg: 'bg-[#fff1eb] text-[#FF6321] border-orange-200' };
      case 'manager':
        return { label: 'MANAGER', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'cashier':
        return { label: 'CASHIER', bg: 'bg-green-50 text-green-800 border-green-200' };
      case 'waiter':
        return { label: 'WAITER', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">Staff Accounts & Role Permissions</h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Manage Owners, Managers, Cashiers, and assigned Waiter zones.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF6321]" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(user => {
          const badge = getRoleBadge(user.role);
          const isCurrentUser = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-3xl border bg-white shadow-2xs flex flex-col justify-between space-y-4 ${
                isCurrentUser ? 'ring-2 ring-[#FF6321]/30 border-[#FF6321]' : 'border-[#e5e7eb]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] text-[#FF6321] font-black text-sm flex items-center justify-center shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#1a1a1a]">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-[#fff1eb] text-[#FF6321] px-1.5 py-0.2 rounded font-bold border border-orange-200">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#6b7280] font-medium">{user.email}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#e5e7eb] space-y-1.5 text-xs text-[#6b7280]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Security PIN:</span>
                    <span className="font-mono font-bold text-[#1a1a1a]">•••• ({user.pin})</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium">Phone:</span>
                      <span className="font-semibold text-[#1a1a1a]">{user.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <span className={`font-bold flex items-center gap-1 ${user.active ? 'text-green-600' : 'text-red-600'}`}>
                      {user.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{user.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>

                  {user.role === 'waiter' && user.assignedTables && user.assignedTables.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                        Assigned Table Zones:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {user.assignedTables.map(tId => {
                          const t = tables.find(tbl => tbl.id === tId);
                          return (
                            <span key={tId} className="text-[10px] bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] px-2 py-0.5 rounded-full font-bold">
                              {t?.number || tId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="px-3 py-1.5 rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] hover:bg-gray-100 text-[#1a1a1a] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-[#FF6321]" />
                  <span>Edit</span>
                </button>

                {staff.length > 1 && !isCurrentUser && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove staff member "${user.name}"?`)) {
                        deleteStaffMember(user.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <h3 className="font-extrabold text-[#1a1a1a] text-base">
                {editingStaff ? 'Edit Staff Profile' : 'New Staff Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. ramesh@urbanspice.com"
                  className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Role *</label>
                  <select
                    value={formData.role || 'waiter'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-xl border border-[#e5e7eb] font-bold bg-white text-[#1a1a1a]"
                  >
                    <option value="owner">Owner (Full Access)</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter (Speed Mode)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">4-Digit POS PIN *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={formData.pin || ''}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-mono font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98450 11223"
                  className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active ?? true}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF6321] border-[#e5e7eb] focus:ring-[#FF6321]"
                  />
                  <span className="font-bold text-xs text-[#1a1a1a]">Account Active & Allowed to Sign In</span>
                </label>
                <p className="text-[10px] text-[#6b7280] ml-6 mt-0.5">
                  Disabling an account blocks login immediately across all terminals.
                </p>
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
                  className="px-5 py-2 bg-[#1a1a1a] hover:bg-black rounded-xl font-bold text-white shadow-xs cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
