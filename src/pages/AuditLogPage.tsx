import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { formatDate, formatTime } from '../utils/formatters';
import { ShieldCheck, Search, Filter, AlertCircle, Clock, User } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchUser && !matchDetails && !matchAction) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'kot_created':
        return { label: 'KOT DISPATCH', bg: 'bg-[#fff1eb] text-[#FF6321] border border-orange-200' };
      case 'kot_reprinted':
        return { label: 'KOT REPRINT', bg: 'bg-orange-50 text-orange-800 border border-orange-200' };
      case 'bill_generated':
        return { label: 'INVOICE PRINTED', bg: 'bg-blue-50 text-blue-800 border border-blue-200' };
      case 'payment_settled':
        return { label: 'PAYMENT SETTLED', bg: 'bg-green-50 text-green-800 border border-green-200' };
      case 'table_transferred':
        return { label: 'TABLE TRANSFER', bg: 'bg-purple-50 text-purple-800 border border-purple-200' };
      case 'table_merged':
        return { label: 'TABLE MERGE', bg: 'bg-indigo-50 text-indigo-800 border border-indigo-200' };
      case 'discount_applied':
        return { label: 'DISCOUNT', bg: 'bg-red-50 text-red-800 border border-red-200' };
      case 'inventory_adjusted':
        return { label: 'STOCK ADJUSTMENT', bg: 'bg-[#f8f9fa] text-[#1a1a1a] border border-[#e5e7eb]' };
      default:
        return { label: action.replace('_', ' ').toUpperCase(), bg: 'bg-[#f8f9fa] text-[#1a1a1a] border border-[#e5e7eb]' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">Security Audit Trail & Activity Logs</h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Immutable chronological record of billings, KOT printings, table transfers, and discounts.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] px-3 py-1.5 rounded-xl">
          {auditLogs.length} Total Events Logged
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e5e7eb]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by staff name, action, or details..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl focus:bg-white focus:border-[#FF6321] focus:outline-hidden text-[#1a1a1a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="text-xs font-bold text-[#1a1a1a] bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl px-3 py-2 focus:outline-hidden"
          >
            <option value="all">All Action Types</option>
            <option value="kot_created">KOT Dispatches</option>
            <option value="payment_settled">Payment Settlements</option>
            <option value="table_transferred">Table Transfers</option>
            <option value="table_merged">Table Merges</option>
            <option value="discount_applied">Discounts</option>
            <option value="inventory_adjusted">Inventory Adjustments</option>
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-2xs overflow-hidden divide-y divide-[#e5e7eb] text-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium">
            No audit logs found.
          </div>
        ) : (
          filteredLogs.map(log => {
            const badge = getActionBadge(log.action);

            return (
              <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#f8f9fa] transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] mt-0.5">
                    <User className="w-4 h-4 text-[#FF6321]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#1a1a1a]">{log.userName}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[#6b7280] mt-1 font-medium">{log.details}</p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
