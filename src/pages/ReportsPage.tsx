import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency, formatDate, isWithinDateRange } from '../utils/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  Users,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const ReportsPage: React.FC = () => {
  const { bills, kots, staff, settings } = usePos();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  // Reports are always calculated from the selected local calendar range.
  const paidBills = bills.filter(
    b => b.status === 'paid' && isWithinDateRange(b.paidAt || b.createdAt, dateRange)
  );
  const filteredKots = kots.filter(k => isWithinDateRange(k.createdAt, dateRange));

  const totalRevenue = paidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalTaxCollected = paidBills.reduce((sum, b) => sum + b.cgstAmount + b.sgstAmount, 0);
  const totalDiscountsGiven = paidBills.reduce((sum, b) => sum + b.discountAmount, 0);
  const totalServiceCharge = paidBills.reduce((sum, b) => sum + b.serviceChargeAmount, 0);

  // Payment Breakdown
  const paymentBreakdown = {
    cash: paidBills.filter(b => b.payment?.method === 'cash').reduce((s, b) => s + b.grandTotal, 0),
    upi: paidBills.filter(b => b.payment?.method === 'upi').reduce((s, b) => s + b.grandTotal, 0),
    card: paidBills.filter(b => b.payment?.method === 'card').reduce((s, b) => s + b.grandTotal, 0),
    split: paidBills.filter(b => b.payment?.method === 'split').reduce((s, b) => s + b.grandTotal, 0),
  };

  // Waiter Sales Performance
  const waiterStats = staff.filter(s => s.role === 'waiter').map(w => {
    const waiterBills = paidBills.filter(b => b.waiterName.toLowerCase() === w.name.toLowerCase());
    const sales = waiterBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const kotsCreated = filteredKots.filter(k => k.waiterName.toLowerCase() === w.name.toLowerCase()).length;

    return {
      name: w.name,
      billsCount: waiterBills.length,
      kotsCount: kotsCreated,
      totalSales: sales,
    };
  });

  // CSV Export Generator
  const exportCsv = () => {
    const headers = ['Invoice Number', 'Table', 'Waiter', 'Items Count', 'Subtotal', 'Discount', 'Taxes', 'Grand Total', 'Payment Mode', 'Date'];
    const rows = paidBills.map(b => [
      b.invoiceNumber,
      b.tableNumber,
      b.waiterName,
      b.items.reduce((s, i) => s + i.quantity, 0),
      b.subtotal,
      b.discountAmount,
      b.cgstAmount + b.sgstAmount,
      b.grandTotal,
      b.payment?.method || 'cash',
      new Date(b.createdAt).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrawarPOS_Sales_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playPaymentSuccess();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">Sales Reports & Tax Ledger</h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Daily Z-Reports, GST reconciliation, waiter efficiency, and CSV export.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-sales-csv-btn"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FF6321]" />
            <span>Download CSV Report</span>
          </button>
        </div>
      </div>

      {/* Report date range */}
      <div className="flex items-center gap-2 bg-white border border-[#e5e7eb] p-1.5 rounded-2xl w-fit">
        {([
          ['today', 'Today'],
          ['week', 'This Week'],
          ['month', 'This Month'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => { setDateRange(value); sounds.playTap(); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              dateRange === value ? 'bg-[#1a1a1a] text-white' : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">Gross Revenue</span>
          <div className="text-xl font-black text-[#1a1a1a] mt-1">{formatCurrency(totalRevenue)}</div>
          <span className="text-[10px] text-green-600 font-semibold">{paidBills.length} Invoices</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">GST Tax Collected</span>
          <div className="text-xl font-black text-[#1a1a1a] mt-1">{formatCurrency(totalTaxCollected)}</div>
          <span className="text-[10px] text-gray-400">CGST (2.5%) + SGST (2.5%)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">Total Discounts</span>
          <div className="text-xl font-black text-red-600 mt-1">{formatCurrency(totalDiscountsGiven)}</div>
          <span className="text-[10px] text-gray-400">Promotions & Courtesy</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs">
          <span className="text-[11px] font-bold text-[#6b7280] uppercase">Service Charge</span>
          <div className="text-xl font-black text-[#1a1a1a] mt-1">{formatCurrency(totalServiceCharge)}</div>
          <span className="text-[10px] text-gray-400">Staff welfare fund</span>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Waiter Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payment Methods */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs">
          <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider mb-4">Payment Method Distribution</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>Cash Collection</span>
              </div>
              <span className="font-black text-sm text-[#1a1a1a]">{formatCurrency(paymentBreakdown.cash)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                <span className="w-3 h-3 rounded-full bg-[#FF6321]" />
                <span>UPI / QR Digital</span>
              </div>
              <span className="font-black text-sm text-[#1a1a1a]">{formatCurrency(paymentBreakdown.upi)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Card Swipe / POS Terminal</span>
              </div>
              <span className="font-black text-sm text-[#1a1a1a]">{formatCurrency(paymentBreakdown.card)}</span>
            </div>

            {paymentBreakdown.split > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Split Settlements</span>
                </div>
                <span className="font-black text-sm text-[#1a1a1a]">{formatCurrency(paymentBreakdown.split)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Waiter Efficiency */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs">
          <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider mb-4">Waiter Sales & Order Velocity</h3>

          <div className="space-y-3 text-xs">
            {waiterStats.map((stat, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <div className="font-black text-[#1a1a1a] text-sm">{stat.name}</div>
                  <div className="text-[11px] text-[#6b7280] mt-0.5 font-medium">
                    {stat.kotsCount} KOTs Sent • {stat.billsCount} Tables Settled
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-[#1a1a1a]">{formatCurrency(stat.totalSales)}</div>
                  <span className="text-[10px] text-green-600 font-bold">Processed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
