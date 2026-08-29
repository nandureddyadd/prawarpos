import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { KOT, Bill } from '../types';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';
import { Printer, X, Check, RefreshCw, AlertTriangle, Download, Copy } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ThermalPrintModalProps {
  onSaved?: () => void;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({ onSaved }) => {
  const { activePrintDoc, setActivePrintDoc, settings, printers, saveAndCompleteBill } = usePos();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!activePrintDoc) return null;

  const handleClose = () => {
    setActivePrintDoc(null);
  };

  const handleBrowserPrint = () => {
    sounds.playPrinterFeed();
    window.print();
  };


  const isKot = activePrintDoc.type === 'kot';
  const isBill = activePrintDoc.type === 'bill' || activePrintDoc.type === 'receipt';
  const isTest = activePrintDoc.type === 'test';

  const kotData = isKot ? (activePrintDoc.data as KOT) : null;
  const billData = isBill ? (activePrintDoc.data as Bill) : null;
  const testData = isTest ? (activePrintDoc.data as { title: string; body: string }) : null;

  const handleSaveBill = async () => {
    if (!billData) return;

    try {
      const saved = saveAndCompleteBill(billData.id);
      if (!saved) {
        throw new Error('Bill could not be saved.');
      }

      setIsSaved(true);
      // App's onSaved callback closes the modal and returns to Tables.
      onSaved?.();
    } catch (error) {
      console.error('Failed to save and complete bill:', error);
      alert('Unable to save the bill. Please try again.');
    }
  };


  // Active printer
  const targetPrinter = isKot 
    ? (printers.find(p => p.type === 'kot' && p.isDefault) || printers[0])
    : (printers.find(p => p.type === 'bill' && p.isDefault) || printers[1] || printers[0]);

  const copyAsText = () => {
    const el = document.getElementById('printable-thermal-doc');
    if (el) {
      navigator.clipboard.writeText(el.innerText || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs no-print select-none">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl bg-white border border-[#e5e7eb] shadow-2xl text-[#1a1a1a] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isKot ? 'bg-[#fff1eb] text-[#FF6321]' : 'bg-green-50 text-green-700'}`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#1a1a1a] text-base">
                  {isKot && `Kitchen Order Ticket (KOT #${kotData?.kotNumber})`}
                  {isBill && `${activePrintDoc.type === 'receipt' ? 'Payment Receipt' : 'Customer Bill'} (${billData?.invoiceNumber})`}
                  {isTest && testData?.title}
                </h3>
                {activePrintDoc.isReprint && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                    REPRINT
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6b7280]">
                Routed to: <span className="text-[#1a1a1a] font-medium">{targetPrinter?.name || 'Default ESC/POS'}</span> ({targetPrinter?.connection.toUpperCase()})
              </p>
            </div>
          </div>

          <button
            id="close-thermal-modal-btn"
            onClick={handleClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Physical Paper Workflow Guidance for KOT */}
        {isKot && (
          <div className="bg-[#fff1eb] border-b border-orange-200 px-4 py-2 text-xs text-[#FF6321] flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Paper KOT Workflow:</strong> Tear off physical slip & deliver to kitchen chef.</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-lg p-0.5">
              <button 
                onClick={() => setPaperWidth('80mm')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${paperWidth === '80mm' ? 'bg-[#FF6321] text-white' : 'text-gray-500'}`}
              >
                80mm
              </button>
              <button 
                onClick={() => setPaperWidth('58mm')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${paperWidth === '58mm' ? 'bg-[#FF6321] text-white' : 'text-gray-500'}`}
              >
                58mm
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Realistic Paper Output */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-5 flex justify-center items-start">
          
          <div
            id="printable-thermal-doc"
            className={`thermal-receipt transition-all rounded-sm shadow-xl p-5 border border-gray-300 bg-white ${
              paperWidth === '58mm' ? 'w-[280px] text-xs' : 'w-[360px] text-sm'
            }`}
          >
            {/* Watermark for REPRINT */}
            {activePrintDoc.isReprint && (
              <div className="mb-2 text-center text-xs font-black tracking-widest text-red-600 border-2 border-red-600 py-1 rounded">
                *** REPRINT COPY (#{kotData?.reprintCount || billData?.reprintCount || 1}) ***
              </div>
            )}

            {/* KOT SLIP CONTENT */}
            {isKot && kotData && (
              <div>
                <div className="text-center pb-2 border-b-2 border-dashed border-black">
                  <h2 className="font-black text-lg uppercase tracking-tight">{settings.name}</h2>
                  <div className="text-sm font-bold mt-0.5 bg-black text-white inline-block px-3 py-0.5 rounded">
                    KOT #{kotData.kotNumber}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatDate(kotData.createdAt)} • {formatTime(kotData.createdAt)}
                  </div>
                </div>

                <div className="my-2 grid grid-cols-2 text-xs font-bold border-b border-dashed border-gray-400 pb-2">
                  <div>
                    <span className="text-gray-500">TABLE:</span> <span className="text-sm font-black">{kotData.tableNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">FLOOR:</span> {kotData.floorName.toUpperCase()}
                  </div>
                  <div className="mt-1">
                    <span className="text-gray-500">WAITER:</span> {kotData.waiterName.toUpperCase()}
                  </div>
                  <div className="mt-1 text-right">
                    <span className="text-gray-500">TYPE:</span> DINE-IN
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-1">
                  <div className="flex font-bold text-xs border-b border-black pb-1 mb-1.5">
                    <span className="w-10">QTY</span>
                    <span className="flex-1">ITEM DETAILS</span>
                  </div>

                  <div className="space-y-2">
                    {kotData.items.map((item, idx) => (
                      <div key={idx} className="leading-tight">
                        <div className="flex font-black text-sm">
                          <span className="w-10 text-base">{item.quantity} ×</span>
                          <span className="flex-1 uppercase">
                            {item.name}
                            {item.variantName ? ` (${item.variantName})` : ''}
                          </span>
                        </div>
                        {/* Customizations / Spice level / Instructions */}
                        {(item.spiceLevel || item.instructions || (item.addons && item.addons.length > 0)) && (
                          <div className="ml-10 text-xs font-bold text-gray-700 mt-0.5">
                            {item.spiceLevel && <span className="text-red-700 bg-red-100 px-1 rounded mr-1">[{item.spiceLevel.toUpperCase()}]</span>}
                            {item.instructions && <span className="italic underline">Note: {item.instructions}</span>}
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-[11px] text-gray-600">+ {item.addons.join(', ')}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {kotData.notes && (
                  <div className="mt-3 p-1.5 bg-gray-100 border border-gray-400 text-xs font-bold">
                    NOTE: {kotData.notes}
                  </div>
                )}

                <div className="mt-3 pt-2 text-center text-xs font-bold border-t-2 border-dashed border-black">
                  <span>KOT #{kotData.kotNumber} — PHYSICAL KITCHEN COPY</span>
                </div>
              </div>
            )}

            {/* BILL / RECEIPT SLIP CONTENT */}
            {isBill && billData && (
              <div>
                <div className="text-center pb-2 border-b-2 border-dashed border-black">
                  {settings.logo && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={settings.logo}
                        alt={`${settings.name || 'Restaurant'} logo`}
                        className="max-h-16 max-w-[140px] object-contain"
                      />
                    </div>
                  )}
                  <h2 className="font-black text-base uppercase">{settings.name}</h2>
                  <p className="text-[11px] text-gray-600 leading-tight">{settings.address}</p>
                  <p className="text-[11px] text-gray-600">Ph: {settings.phone}</p>
                  {settings.gstNumber && <p className="text-[11px] font-bold">GSTIN: {settings.gstNumber}</p>}
                  {settings.fssaiNumber && <p className="text-[10px] text-gray-500">FSSAI: {settings.fssaiNumber}</p>}
                  
                  <div className="mt-2 text-xs font-bold uppercase tracking-wider py-0.5 bg-gray-200">
                    {billData.status === 'paid' ? 'TAX INVOICE / RECEIPT' : 'GUEST ESTIMATE / BILL'}
                  </div>
                </div>

                <div className="my-2 grid grid-cols-2 text-xs border-b border-dashed border-gray-400 pb-2">
                  <div>
                    <span className="text-gray-500">INV #:</span> <span className="font-bold">{billData.invoiceNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">DATE:</span> {formatDate(billData.createdAt)}
                  </div>
                  <div>
                    <span className="text-gray-500">TABLE:</span> <span className="font-bold">{billData.tableNumber}</span> ({billData.floorName})
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">TIME:</span> {formatTime(billData.createdAt)}
                  </div>
                  {billData.customerName && (
                    <div className="text-right truncate">
                      <span className="text-gray-500">GUEST:</span> {billData.customerName}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="py-1">
                  <div className="flex font-bold text-xs border-b border-black pb-1 mb-1">
                    <span className="flex-1">ITEM</span>
                    <span className="w-8 text-center">QTY</span>
                    <span className="w-12 text-right">RATE</span>
                    <span className="w-16 text-right">AMOUNT</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {billData.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex leading-tight">
                        <span className="flex-1 font-semibold truncate pr-1">
                          {item.name}
                          {item.variant ? ` (${item.variant.name})` : ''}
                        </span>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <span className="w-12 text-right">{item.price}</span>
                        <span className="w-16 text-right font-bold">{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="mt-2 pt-2 border-t-2 border-dashed border-black text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Sub Total</span>
                    <span className="font-bold">{formatCurrency(billData.subtotal)}</span>
                  </div>

                  {billData.discountAmount > 0 && (
                    <div className="flex justify-between text-red-700">
                      <span>Discount ({billData.discountType === 'percentage' ? `${billData.discountValue}%` : 'Fixed'})</span>
                      <span>-{formatCurrency(billData.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>CGST ({billData.cgstRate}%)</span>
                    <span>{formatCurrency(billData.cgstAmount)}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>SGST ({billData.sgstRate}%)</span>
                    <span>{formatCurrency(billData.sgstAmount)}</span>
                  </div>

                  {billData.serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span>Service Charge ({billData.serviceChargeRate}%)</span>
                      <span>{formatCurrency(billData.serviceChargeAmount)}</span>
                    </div>
                  )}

                  {billData.roundOff !== 0 && (
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Round Off</span>
                      <span>{billData.roundOff > 0 ? `+${billData.roundOff}` : billData.roundOff}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black border-t-2 border-black pt-1 mt-1">
                    <span>GRAND TOTAL</span>
                    <span>{formatCurrency(billData.grandTotal)}</span>
                  </div>
                </div>

                {/* Payment summary if paid */}
                {billData.status === 'paid' && billData.payment && (
                  <div className="mt-2 p-1.5 bg-gray-100 border border-gray-300 text-xs font-bold">
                    <div className="flex justify-between">
                      <span>PAID VIA:</span>
                      <span className="uppercase text-green-800">{billData.payment.method}</span>
                    </div>
                    {billData.payment.reference && (
                      <div className="text-[10px] text-gray-500 font-normal">Ref: {billData.payment.reference}</div>
                    )}
                    {billData.payment.cashTendered && (
                      <div className="flex justify-between text-[11px] font-normal mt-0.5">
                        <span>Tendered: {formatCurrency(billData.payment.cashTendered)}</span>
                        <span>Change: {formatCurrency(billData.payment.changeGiven || 0)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-2 text-center text-xs text-gray-600 border-t border-dashed border-gray-400">
                  <p className="font-bold">Thank you for dining with us!</p>
                  <p className="text-[10px]">Please visit again</p>
                </div>
              </div>
            )}

            {/* TEST PRINT CONTENT */}
            {isTest && testData && (
              <div className="text-center font-mono text-xs whitespace-pre-wrap py-2">
                <h3 className="font-bold text-sm mb-2">{testData.title}</h3>
                <p>{testData.body}</p>
              </div>
            )}

          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] bg-white p-4">
          <button
            id="dismiss-print-btn"
            onClick={handleClose}
            className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] px-5 py-2.5 text-xs font-semibold text-[#6b7280] hover:bg-gray-100 transition cursor-pointer"
          >
            CLOSE
          </button>

          {isBill && (
            <button
              id="save-bill-btn"
              onClick={handleSaveBill}
              className="rounded-xl border border-[#dbeafe] bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            >
              {isSaved ? 'SAVED' : 'SAVE'}
            </button>
          )}

          <button
            id="trigger-print-btn"
            onClick={handleBrowserPrint}
            className="flex items-center gap-2 rounded-xl bg-[#1a1a1a] hover:bg-black px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FF6321]" />
            <span>{isKot ? 'PRINT KOT' : 'PRINT BILL'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
