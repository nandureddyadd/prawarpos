import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import {
  Sparkles,
  Building2,
  Layers,
  UtensilsCrossed,
  BookOpen,
  Users,
  Printer,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface OnboardingSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTableManagement: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const OnboardingSetupModal: React.FC<OnboardingSetupModalProps> = ({
  isOpen,
  onClose,
  onOpenTableManagement,
  onNavigateToTab,
}) => {
  const {
    settings,
    updateSettings,
    floors,
    tables,
    categories,
    menuItems,
    staff,
    printers,
  } = usePos();

  const [restaurantName, setRestaurantName] = useState(settings.name === 'My Restaurant' ? '' : settings.name);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');

  if (!isOpen) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: restaurantName.trim() || 'My Restaurant',
      gstNumber: gstNumber.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    sounds.playPaymentSuccess();
  };

  const steps = [
    {
      id: 1,
      title: 'Restaurant Profile',
      desc: 'Name, GST number, address, and billing contact',
      isComplete: !!(settings.name && settings.name !== 'My Restaurant' && (settings.phone || settings.address)),
      action: 'Configure in Settings',
      onAction: () => onNavigateToTab('settings'),
    },
    {
      id: 2,
      title: 'Floors & Sections',
      desc: 'Add Ground Floor, AC Hall, Rooftop, Patio, etc.',
      isComplete: floors.length > 0,
      action: '+ Manage Floors',
      onAction: onOpenTableManagement,
    },
    {
      id: 3,
      title: 'Tables & Seating',
      desc: 'Define table numbers and seating capacities',
      isComplete: tables.length > 0,
      action: '+ Add Tables',
      onAction: onOpenTableManagement,
    },
    {
      id: 4,
      title: 'Menu Categories & Dishes',
      desc: 'Add your restaurant categories and menu items',
      isComplete: menuItems.length > 0,
      action: '+ Manage Menu',
      onAction: () => onNavigateToTab('menu'),
    },
    {
      id: 5,
      title: 'Staff & Waiters',
      desc: 'Add cashiers, managers, and waiters with PINs',
      isComplete: staff.length > 1,
      action: '+ Add Staff',
      onAction: () => onNavigateToTab('staff'),
    },
    {
      id: 6,
      title: 'Printers & ESC/POS Routing',
      desc: 'Set up 80mm or 58mm kitchen & billing thermal printers',
      isComplete: printers.length > 0,
      action: 'Check Printers',
      onAction: () => onNavigateToTab('settings'),
    },
  ];

  const completedCount = steps.filter(s => s.isComplete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1a1a1a]">
                Welcome to Prawar POS — Restaurant Setup
              </h3>
              <p className="text-xs text-[#6b7280]">
                Configure your real restaurant information to start taking orders
              </p>
            </div>
          </div>

          <button
            id="close-onboarding-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
          
          {/* Progress Bar */}
          <div className="bg-[#f8f9fa] p-4 rounded-2xl border border-[#e5e7eb]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-[#1a1a1a]">Setup Progress</span>
              <span className="text-[#FF6321]">{completedCount} of {steps.length} Steps Ready ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6321] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Restaurant Profile Form if not set */}
          {(!settings.name || settings.name === 'My Restaurant') && (
            <form onSubmit={handleSaveInfo} className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF6321]" />
                <span>1. Quick Restaurant Profile</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6b7280] mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    id="input-setup-restaurant-name"
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    placeholder="e.g. Royal Dine & Grill"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6b7280] mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    id="input-setup-restaurant-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  id="save-setup-profile-btn"
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* Setup Checklist */}
          <div className="space-y-2.5">
            {steps.map(step => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs hover:border-[#FF6321] transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-xl mt-0.5 ${
                    step.isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1a1a1a] flex items-center gap-2">
                      <span>{step.title}</span>
                      {step.isComplete && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                          Ready
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-[#6b7280] font-medium">{step.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  id={`onboarding-step-${step.id}-btn`}
                  onClick={() => {
                    step.onAction();
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f8f9fa] hover:bg-[#fff1eb] text-[#1a1a1a] hover:text-[#FF6321] border border-[#e5e7eb] text-xs font-bold transition cursor-pointer shrink-0"
                >
                  <span>{step.action}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
          <span className="text-xs text-[#6b7280]">
            You can return to settings or management at any time.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            Start Using POS
          </button>
        </div>

      </div>
    </div>
  );
};
