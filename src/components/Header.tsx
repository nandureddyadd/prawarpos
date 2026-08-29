import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import {
  Search,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Building2,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const {
    currentUser,
    currentBranch,
    branches,
    setCurrentBranch,
    isOnline,
    setIsOnline,
    settings,
    updateSettings,
    logout,
    staff,
    switchUserById,
    kots,
    inventory,
    floors,
    selectedFloorId,
  } = usePos();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Low stock alerts count
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStock).length;

  // Active Floor Name
  const activeFloor = floors.find(f => f.id === selectedFloorId)?.name || 'All Floors';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const nextVal = !settings.soundEffects;
    updateSettings({ soundEffects: nextVal });
    if (nextVal) {
      sounds.playTap();
    }
  };

  const toggleOnlineMode = () => {
    const next = !isOnline;
    setIsOnline(next);
    sounds.playAlert();
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'manager':
        return 'Manager';
      case 'cashier':
        return 'Cashier';
      case 'waiter':
        return 'Waiter';
      default:
        return 'Staff';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e5e7eb] bg-white px-4 md:px-6 select-none shrink-0">
      
      {/* Left: Brand + Location */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img
              src="/prawar-logo.jpeg"
              alt="Prawar"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase text-[#1a1a1a] leading-tight">
              Prawar POS
            </h1>
            <p className="text-xs text-[#6b7280] font-medium">
              {currentBranch.name} • {activeFloor}
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-[#e5e7eb] hidden md:block" />

        {/* Branch Selector */}
        <div className="relative hidden md:block">
          <button
            id="branch-dropdown-btn"
            onClick={() => {
              setShowBranchMenu(!showBranchMenu);
              setShowRoleSwitcher(false);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f3f4f6] transition"
          >
            <Building2 className="w-3.5 h-3.5 text-[#6b7280]" />
            <span className="max-w-[150px] truncate">{currentBranch.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6b7280]" />
          </button>

          {showBranchMenu && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white border border-[#e5e7eb] shadow-xl py-1 z-40">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                Select Active Branch
              </div>
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    setCurrentBranch(b);
                    setShowBranchMenu(false);
                    sounds.playTap();
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#f8f9fa] ${
                    b.id === currentBranch.id ? 'bg-[#fff1eb] text-[#FF6321] font-bold' : 'text-[#1a1a1a]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-[10px] text-[#6b7280]">{b.code}</div>
                  </div>
                  {b.isMain && (
                    <span className="text-[9px] bg-[#f3f4f6] text-[#6b7280] px-1.5 py-0.5 rounded font-bold">
                      Main
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Input Trigger */}
      <div className="flex-1 max-w-sm mx-4 hidden lg:block">
        <button
          id="global-search-trigger-btn"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between rounded-lg bg-[#f8f9fa] hover:bg-[#f3f4f6] border border-[#e5e7eb] px-3.5 py-1.5 text-xs text-[#6b7280] transition group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6b7280] group-hover:text-[#1a1a1a]" />
            <span>Search table, menu, KOT, bill...</span>
          </div>
          <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6b7280] border border-[#e5e7eb]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Date/Time + Status + User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Mobile Search Icon */}
        <button
          id="mobile-search-btn"
          onClick={onOpenSearch}
          className="lg:hidden p-2 rounded-lg text-[#1a1a1a] hover:bg-[#f3f4f6]"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Date & Time */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
            {currentDateFormatted}
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]">
            {currentTime}
          </p>
        </div>

        {/* Utility Toggles: Online & Sound & Alerts */}
        <div className="flex items-center gap-1.5">
          <button
            id="online-status-toggle-btn"
            onClick={toggleOnlineMode}
            title={isOnline ? 'System is Online' : 'System is Offline'}
            className={`p-2 rounded-lg border transition ${
              isOnline
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-orange-50 text-[#FF6321] border-orange-200'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-green-600" /> : <WifiOff className="w-3.5 h-3.5 text-[#FF6321]" />}
          </button>

          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            title={settings.soundEffects ? 'Sound Enabled' : 'Sound Muted'}
            className={`p-2 rounded-lg border transition ${
              settings.soundEffects
                ? 'bg-[#f8f9fa] text-[#1a1a1a] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                : 'bg-[#f3f4f6] text-[#9ca3af] border-[#e5e7eb]'
            }`}
          >
            {settings.soundEffects ? <Volume2 className="w-3.5 h-3.5 text-[#FF6321]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              id="notifications-btn"
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowRoleSwitcher(false);
                setShowBranchMenu(false);
              }}
              className="p-2 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] text-[#1a1a1a] hover:bg-[#f3f4f6] relative transition"
            >
              <Bell className="w-3.5 h-3.5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6321] text-[9px] font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xl p-3 z-40">
                <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb] mb-2">
                  <h4 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Restaurant Alerts</h4>
                  <span className="text-[11px] text-[#6b7280] font-medium">Real-time</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                  {lowStockCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950">
                      <div className="font-bold flex items-center gap-1.5 text-orange-900">
                        <span>⚠️ {lowStockCount} Items Low in Stock</span>
                      </div>
                      <p className="text-[11px] text-orange-800 mt-0.5">
                        Raw materials need replenishment.
                      </p>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a]">
                    <div className="font-bold flex items-center justify-between">
                      <span>Paper KOT Routing Active</span>
                      <span className="text-[10px] text-green-600 font-semibold">Online</span>
                    </div>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">
                      Direct thermal printer ready.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            id="user-profile-menu-btn"
            onClick={() => {
              setShowRoleSwitcher(!showRoleSwitcher);
              setShowBranchMenu(false);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-3 pl-3 md:pl-6 border-l border-[#e5e7eb] hover:opacity-80 transition cursor-pointer text-left"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#1a1a1a] leading-tight">
                {currentUser?.name || 'Staff'}
              </p>
              <p className="text-xs text-green-600 font-medium">
                {getRoleDisplay(currentUser?.role)} • {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            
            <div className="w-10 h-10 bg-[#e5e7eb] rounded-full flex items-center justify-center font-bold text-sm text-[#1a1a1a] shadow-2xs">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
          </button>

          {/* Quick Role Switcher Modal Dropdown */}
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xl p-3 z-40">
              <div className="pb-2 border-b border-[#e5e7eb] mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                  Active Station Account
                </div>
                <div className="text-xs font-bold text-[#1a1a1a] mt-0.5">
                  {currentUser?.name}
                </div>
                <div className="text-[11px] text-[#6b7280] truncate font-mono">
                  {currentUser?.email}
                </div>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6321]">
                    {getRoleDisplay(currentUser?.role)}
                  </span>
                </div>
              </div>

              {staff.length > 1 && (currentUser?.role === 'owner' || currentUser?.role === 'manager') && (
                <div className="mb-2">
                  <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1 px-1">
                    Switch Station Operator:
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {staff.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchUserById(member.id);
                          setShowRoleSwitcher(false);
                          sounds.playTap();
                        }}
                        className={`w-full flex items-center justify-between p-1.5 rounded-xl text-xs transition cursor-pointer ${
                          currentUser?.id === member.id
                            ? 'bg-[#fff1eb] text-[#FF6321] font-bold border border-orange-200'
                            : 'text-[#1a1a1a] hover:bg-[#f8f9fa]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-[#e5e7eb] flex items-center justify-center font-bold text-[9px] text-[#1a1a1a]">
                            {member.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-[11px]">{member.name}</div>
                            <div className="text-[9px] text-[#6b7280] capitalize">{member.role}</div>
                          </div>
                        </div>
                        {currentUser?.id === member.id && (
                          <span className="text-[9px] text-[#FF6321] font-bold">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#e5e7eb]">
                <button
                  id="lock-logout-btn"
                  onClick={() => {
                    logout();
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Lock Station</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
