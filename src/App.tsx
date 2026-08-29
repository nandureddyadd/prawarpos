import React, { useState, useEffect } from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ThermalPrintModal } from './components/ThermalPrintModal';
import { DashboardPage } from './pages/DashboardPage';
import { PosOrdersPage } from './pages/PosOrdersPage';
import { KotHistoryPage } from './pages/KotHistoryPage';
import { BillingPage } from './pages/BillingPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { InventoryPage } from './pages/InventoryPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const PosAppShell: React.FC = () => {
  const { currentUser, authLoading, printJob, setPrintJob } = usePos();
  
  // Default to pos-tables if waiter/cashier, or dashboard if owner/manager
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [billingTargetTableId, setBillingTargetTableId] = useState<string | undefined>(undefined);

  // Sync initial tab when user logs in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'waiter' || currentUser.role === 'cashier') {
        setActiveTab('pos-tables');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  // Loading state while verifying Supabase session
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f8f9fa] text-[#1a1a1a] font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e7eb] flex items-center justify-center shadow-md animate-pulse overflow-hidden">
            <img
              src="/prawar-logo.jpeg"
              alt="Prawar"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black tracking-tight uppercase text-[#1a1a1a]">
              PrawarPOS
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#6b7280]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF6321]" />
              <span>Verifying Supabase secure session...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated with Supabase, render AuthView
  if (!currentUser) {
    return <AuthView />;
  }

  const handleNavigateToBilling = (tableId?: string) => {
    setBillingTargetTableId(tableId);
    setActiveTab('billing');
  };

  // Role permissions check
  const role = currentUser.role || 'waiter';
  const isManagerOrOwner = role === 'owner' || role === 'manager';
  const isCashier = role === 'cashier';

  const canAccessTab = (tab: NavTab): boolean => {
    if (isManagerOrOwner) return true;
    if (isCashier) {
      return tab === 'pos-tables' || tab === 'kots' || tab === 'billing';
    }
    // Waiter / Staff
    return tab === 'pos-tables' || tab === 'kots' || tab === 'billing';
  };

  const isRestricted = !canAccessTab(activeTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={tab => {
          if (canAccessTab(tab)) {
            setActiveTab(tab);
            if (tab !== 'billing') {
              setBillingTargetTableId(undefined);
            }
          }
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Header */}
        <Header onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Dynamic Page Views */}
        <main className="flex-1 flex overflow-hidden">
          {isRestricted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8f9fa]">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a] tracking-tight mb-2">
                Access Restricted
              </h2>
              <p className="text-xs text-[#6b7280] max-w-sm mb-6 leading-relaxed">
                Your staff account role (<strong className="uppercase text-[#1a1a1a]">{role}</strong>) does not have authorization to view this section.
              </p>
              <button
                onClick={() => setActiveTab('pos-tables')}
                className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Return to Table View
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  onNavigateTab={(tab, tableId) => {
                    if (tab === 'billing' && tableId) {
                      handleNavigateToBilling(tableId);
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                />
              )}

              {activeTab === 'pos-tables' && (
                <PosOrdersPage onNavigateToBilling={handleNavigateToBilling} />
              )}

              {activeTab === 'kots' && <KotHistoryPage />}

              {activeTab === 'billing' && (
                <BillingPage initialTableId={billingTargetTableId} />
              )}

              {activeTab === 'menu' && <MenuManagementPage />}

              {activeTab === 'inventory' && <InventoryPage />}

              {activeTab === 'staff' && <StaffManagementPage />}

              {activeTab === 'reports' && <ReportsPage />}

              {activeTab === 'audit' && <AuditLogPage />}

              {activeTab === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Global Fast Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTable={tableId => {
          setActiveTab('pos-tables');
        }}
        onSelectBill={billId => {
          setActiveTab('billing');
        }}
      />

      {/* Hardware ESC/POS Print Preview & Printer Modal */}
      {printJob && (
        <ThermalPrintModal
          onSaved={() => {
            setPrintJob(null);
            setActiveTab('pos-tables');
          }}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <PosProvider>
      <PosAppShell />
    </PosProvider>
  );
}
