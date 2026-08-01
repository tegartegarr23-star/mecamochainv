import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { IngredientsManager } from './components/MasterData/IngredientsManager';
import { MenusManager } from './components/Menus/MenusManager';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { ReportsView } from './components/Reports/ReportsView';
import { UserManager } from './components/Users/UserManager';
import { SupabaseModal } from './components/SupabaseModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<'purchase' | 'prepare' | 'production' | 'adjustment' | undefined>(
    undefined
  );

  const handleOpenQuickAction = (action: 'purchase' | 'prepare' | 'production' | 'adjustment') => {
    setQuickAction(action);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setQuickAction(undefined);
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Sticky Header */}
        <Header
          activeTab={activeTab}
          setIsOpenSidebar={setIsSidebarOpen}
          onOpenQuickAction={handleOpenQuickAction}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {activeTab === 'ingredients' && <IngredientsManager />}

          {activeTab === 'menus' && <MenusManager />}

          {activeTab === 'recipes' && <MenusManager />}

          {activeTab === 'transactions' && (
            <TransactionsView initialAction={quickAction} />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'users' && <UserManager />}

          {activeTab === 'supabase' && <SupabaseModal />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}
