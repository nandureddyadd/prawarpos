import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { RestaurantSettings, PrinterConfig } from '../types';
import {
  Settings,
  Printer,
  Building2,
  Percent,
  Volume2,
  Save,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sliders,
  Upload,
  Trash2,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, printers, updatePrinters, printJob, setPrintJob } = usePos();
  const [formData, setFormData] = useState<RestaurantSettings>({ ...settings });
  const [localPrinters, setLocalPrinters] = useState<PrinterConfig[]>([...printers]);
  const [isSaved, setIsSaved] = useState(false);

  const handleRestaurantLogoUpload = (file?: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      window.alert('Please choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('Logo image must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result || '');
      const image = new Image();

      image.onload = () => {
        const maxSize = 500;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setFormData(prev => ({ ...prev, logo: source }));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedLogo = canvas.toDataURL('image/jpeg', 0.86);
        setFormData(prev => ({ ...prev, logo: compressedLogo }));
      };

      image.onerror = () => {
        window.alert('Unable to read this image. Please choose another logo.');
      };

      image.src = source;
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveRestaurantLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    updatePrinters(localPrinters);
    sounds.playPaymentSuccess();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestKitchenPrint = () => {
    sounds.playPrinterChime();
    if (setPrintJob) {
      setPrintJob({
        type: 'kot',
        data: {
          id: 'kot-test',
          kotNumber: 9999,
          orderId: 'ord-test',
          tableId: 't-test',
          tableNumber: 'T-TEST',
          floorName: 'Ground Floor',
          waiterId: 'w-1',
          waiterName: 'Test Engineer',
          items: [
            { id: 'item-1', menuItemId: 'm-1', name: 'Tandoori Chicken Tikka (TEST)', quantity: 2, price: 380, instructions: 'Spicy, Well Done', isSentToKot: true },
            { id: 'item-2', menuItemId: 'm-2', name: 'Garlic Naan (TEST)', quantity: 4, price: 60, isSentToKot: true },
          ],
          notes: 'PHYSICAL PRINTER HARDWARE LOOPBACK TEST',
          printStatus: 'printed',
          createdAt: new Date().toISOString(),
          printedAt: new Date().toISOString(),
          reprintCount: 0,
        },
      });
    }
  };

  const handleTestBillPrint = () => {
    sounds.playPrinterChime();
    if (setPrintJob) {
      setPrintJob({
        type: 'bill',
        data: {
          id: 'bill-test',
          invoiceNumber: 'INV-TEST-001',
          orderId: 'ord-test',
          tableId: 't-test',
          tableNumber: 'T-TEST',
          floorName: 'Ground Floor',
          waiterId: 'w-1',
          waiterName: 'Test Cashier',
          items: [
            { id: 'ci-1', menuItemId: 'm-1', name: 'Hyderabadi Dum Biryani', price: 380, quantity: 2, isVeg: false, isSentToKot: true },
            { id: 'ci-2', menuItemId: 'm-2', name: 'Fresh Lime Soda', price: 120, quantity: 2, isVeg: true, isSentToKot: true },
          ],
          subtotal: 1000,
          discountType: 'percentage',
          discountValue: 10,
          discountAmount: 100,
          cgstRate: 2.5,
          cgstAmount: 22.5,
          sgstRate: 2.5,
          sgstAmount: 22.5,
          serviceChargeRate: 5,
          serviceChargeAmount: 45,
          roundOff: 0,
          grandTotal: 968,
          status: 'paid',
          payment: {
            method: 'upi',
            amount: 968,
            reference: 'UPI-TEST-123456',
          },
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          reprintCount: 0,
        },
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">Restaurant Settings & Hardware Setup</h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Configure GST rates, thermal printer routing (80mm/58mm), sounds, and branding.
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 font-bold text-xs border border-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Section 1: Restaurant Profile */}
        <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e5e7eb]">
            <Building2 className="w-4 h-4 text-[#FF6321]" />
            <h3 className="font-extrabold text-sm text-[#1a1a1a] uppercase tracking-wider">Restaurant Business Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Restaurant Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">GSTIN Tax Registration Number</label>
              <input
                type="text"
                value={formData.gstNumber || ''}
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-mono font-bold text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Business Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Restaurant Bill Branding */}
        <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF6321]" />
              <div>
                <h3 className="font-extrabold text-sm text-[#1a1a1a] uppercase tracking-wider">Restaurant Bill Logo</h3>
                <p className="text-[10px] text-[#6b7280] font-medium mt-0.5">
                  This logo appears on customer bills. Your Prawar logo remains the platform logo. You can change it anytime below.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-28 h-28 rounded-2xl border border-dashed border-[#d1d5db] bg-[#f8f9fa] flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt={`${formData.name || 'Restaurant'} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center px-3">
                  <Building2 className="w-7 h-7 mx-auto text-gray-300 mb-1" />
                  <span className="text-[9px] font-bold uppercase text-gray-400">No logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                id="restaurant-logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  handleRestaurantLogoUpload(e.target.files?.[0]);
                  e.currentTarget.value = '';
                }}
              />
              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="restaurant-logo-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.logo ? 'Change Logo' : 'Upload Logo'}</span>
                </label>

                {formData.logo && (
                  <button
                    type="button"
                    onClick={handleRemoveRestaurantLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#6b7280] leading-relaxed">
                JPG, PNG or WEBP • Maximum 5 MB. The image is optimized and saved with your restaurant settings.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Taxes & Financial Rules */}

        <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e5e7eb]">
            <Percent className="w-4 h-4 text-green-600" />
            <h3 className="font-extrabold text-sm text-[#1a1a1a] uppercase tracking-wider">GST Rates & Surcharges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.cgstRate ?? 2.5}
                onChange={e => setFormData({ ...formData, cgstRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-bold text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sgstRate ?? 2.5}
                onChange={e => setFormData({ ...formData, sgstRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-bold text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Service Charge Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.serviceChargeRate ?? 5}
                onChange={e => setFormData({ ...formData, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] font-bold text-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableServiceCharge ?? true}
                onChange={e => setFormData({ ...formData, enableServiceCharge: e.target.checked })}
                className="rounded border-[#e5e7eb] text-[#FF6321] focus:ring-[#FF6321]"
              />
              <span className="font-semibold text-[#1a1a1a]">Apply Service Charge to Invoices</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableRoundOff ?? true}
                onChange={e => setFormData({ ...formData, enableRoundOff: e.target.checked })}
                className="rounded border-[#e5e7eb] text-[#FF6321] focus:ring-[#FF6321]"
              />
              <span className="font-semibold text-[#1a1a1a]">Round Off Final Rupee Amount</span>
            </label>
          </div>
        </div>

        {/* Section 4: Hardware Thermal Printers (ESC/POS) */}
        <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#FF6321]" />
              <h3 className="font-extrabold text-sm text-[#1a1a1a] uppercase tracking-wider">Thermal Printer Routing (80mm / 58mm)</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="test-kitchen-print-btn"
                onClick={handleTestKitchenPrint}
                className="px-3 py-1.5 bg-[#fff1eb] hover:bg-orange-100 text-[#FF6321] border border-orange-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Test KOT Slip</span>
              </button>

              <button
                type="button"
                id="test-bill-print-btn"
                onClick={handleTestBillPrint}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#1a1a1a] border border-[#e5e7eb] rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Test Bill Slip</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {localPrinters.map((printer, idx) => (
              <div key={printer.id} className="p-4 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1a1a1a] text-sm">{printer.name}</span>
                  <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    {printer.type.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6b7280] mb-1">Paper Width</label>
                    <select
                      value={printer.paperSize}
                      onChange={e => {
                        const updated = [...localPrinters];
                        updated[idx].paperSize = e.target.value as '80mm' | '58mm';
                        setLocalPrinters(updated);
                      }}
                      className="w-full p-2 rounded-xl border border-[#e5e7eb] font-bold bg-white text-[#1a1a1a] text-xs"
                    >
                      <option value="80mm">80mm (Standard)</option>
                      <option value="58mm">58mm (Compact)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#6b7280] mb-1">Interface Connection</label>
                    <select
                      value={printer.connection}
                      onChange={e => {
                        const updated = [...localPrinters];
                        updated[idx].connection = e.target.value as 'network' | 'usb' | 'bluetooth';
                        setLocalPrinters(updated);
                      }}
                      className="w-full p-2 rounded-xl border border-[#e5e7eb] font-bold bg-white text-[#1a1a1a] text-xs"
                    >
                      <option value="network">LAN / Ethernet IP</option>
                      <option value="usb">USB Direct</option>
                      <option value="bluetooth">Bluetooth Wireless</option>
                    </select>
                  </div>
                </div>

                {printer.connection === 'network' && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#6b7280] mb-1">Printer IP Address</label>
                    <input
                      type="text"
                      value={printer.ipAddress || ''}
                      onChange={e => {
                        const updated = [...localPrinters];
                        updated[idx].ipAddress = e.target.value;
                        setLocalPrinters(updated);
                      }}
                      placeholder="192.168.1.200"
                      className="w-full p-2 rounded-xl border border-[#e5e7eb] bg-white font-mono font-bold text-[#1a1a1a] text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: System Audio & UX Preferences */}
        <div className="p-6 rounded-3xl bg-white border border-[#e5e7eb] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e5e7eb]">
            <Volume2 className="w-4 h-4 text-[#FF6321]" />
            <h3 className="font-extrabold text-sm text-[#1a1a1a] uppercase tracking-wider">Audio Feedback & Interface</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.soundEffects ?? true}
                onChange={e => setFormData({ ...formData, soundEffects: e.target.checked })}
                className="rounded border-[#e5e7eb] text-[#FF6321] focus:ring-[#FF6321]"
              />
              <span className="font-semibold text-[#1a1a1a]">
                Low-Latency Web Audio Chimes (KOT dispatch tone, payment success chime, printer simulation)
              </span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="save-all-settings-btn"
            className="flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#FF6321]" />
            <span>Save All Restaurant Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};
