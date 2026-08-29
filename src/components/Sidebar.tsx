import React from 'react';
import { usePos } from '../context/PosContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CreditCard,
  BookOpen,
  Boxes,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type NavTab = 
  | 'dashboard'
  | 'pos-tables'
  | 'kots'
  | 'billing'
  | 'menu'
  | 'inventory'
  | 'staff'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, tables, inventory } = usePos();
  const role = currentUser?.role || 'waiter';

  // Live badge counts
  const activeTablesCount = tables.filter(t => t.status === 'occupied' || t.status === 'ordering').length;
  const billingTablesCount = tables.filter(t => t.status === 'billing').length;
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStock).length;

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    roles: ('owner' | 'manager' | 'cashier' | 'waiter')[];
    isBottom?: boolean;
  }

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      roles: ['owner', 'manager'],
    },
    {
      id: 'pos-tables',
      label: 'Tables',
      icon: UtensilsCrossed,
      badge: activeTablesCount > 0 ? activeTablesCount : undefined,
      badgeColor: 'bg-[#FF6321] text-white',
      roles: ['owner', 'manager', 'cashier', 'waiter'],
    },
    {
      id: 'kots',
      label: 'KOTs',
      icon: ClipboardList,
      roles: ['owner', 'manager', 'cashier', 'waiter'],
    },
    {
      id: 'billing',
      label: 'Bills',
      icon: CreditCard,
      badge: billingTablesCount > 0 ? billingTablesCount : undefined,
      badgeColor: 'bg-[#1a1a1a] text-white',
      roles: ['owner', 'manager', 'cashier', 'waiter'],
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: BookOpen,
      roles: ['owner', 'manager'],
    },
    {
      id: 'inventory',
      label: 'Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      roles: ['owner', 'manager'],
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: Users,
      roles: ['owner', 'manager'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      roles: ['owner', 'manager'],
    },
    {
      id: 'audit',
      label: 'Audit',
      icon: ShieldCheck,
      roles: ['owner', 'manager'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['owner', 'manager'],
      isBottom: true,
    },
  ];

  const mainItems = allNavItems.filter(item => item.roles.includes(role) && !item.isBottom);
  const bottomItems = allNavItems.filter(item => item.roles.includes(role) && item.isBottom);

  return (
    <nav className="w-16 md:w-20 bg-white border-r border-[#e5e7eb] flex flex-col items-center py-4 md:py-6 gap-4 md:gap-5 select-none shrink-0 overflow-y-auto no-scrollbar">
      
      {/* Main Top Navigation Items */}
      <div className="flex flex-col items-center gap-3 md:gap-4 w-full px-2">
        {mainItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}-btn`}
              onClick={() => {
                onSelectTab(item.id);
                sounds.playTap();
              }}
              title={item.label}
              className={`flex flex-col items-center gap-1 transition-all group w-full relative ${
                isActive ? 'opacity-100 text-[#FF6321]' : 'opacity-40 hover:opacity-100 text-[#1a1a1a]'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors relative ${
                  isActive ? 'bg-[#fff1eb] text-[#FF6321]' : 'group-hover:bg-[#f8f9fa]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />

                {/* Badge Pip */}
                {item.badge && (
                  <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black ${item.badgeColor || 'bg-[#FF6321] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Section (Settings / Audit) */}
      <div className="mt-auto flex flex-col items-center gap-3 w-full px-2 pt-2 border-t border-[#e5e7eb]">
        {bottomItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}-btn`}
              onClick={() => {
                onSelectTab(item.id);
                sounds.playTap();
              }}
              title={item.label}
              className={`flex flex-col items-center gap-1 transition-all group w-full ${
                isActive ? 'opacity-100 text-[#FF6321]' : 'opacity-40 hover:opacity-100 text-[#1a1a1a]'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#fff1eb] text-[#FF6321]' : 'group-hover:bg-[#f8f9fa]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

    </nav>
  );
};
