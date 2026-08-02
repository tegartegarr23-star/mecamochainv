import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  UtensilsCrossed,
  ArrowRightLeft,
  FileSpreadsheet,
  Users,
  Database,
  Coffee,
  X,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ChefHat,
  SlidersHorizontal,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export type NavTab =
  | 'dashboard'
  | 'ingredients'
  | 'menus'
  | 'recipes'
  | 'transactions'
  | 'reports'
  | 'users';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const { currentUser, isSuperAdmin } = useInventory();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'ingredients' as NavTab,
      label: 'Master Bahan & Data',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'menus' as NavTab,
      label: 'Daftar Menu & Resep',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: 'transactions' as NavTab,
      label: 'Transaksi & Stok',
      icon: ArrowRightLeft,
      badge: 'Core',
    },
    {
      id: 'reports' as NavTab,
      label: 'Laporan & Mutasi',
      icon: FileSpreadsheet,
      badge: null,
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'users' as NavTab,
            label: 'Manajemen User',
            icon: Users,
            badge: 'Admin',
          },
        ]
      : []),
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setIsOpen(false); // Close sidebar on mobile select
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-60 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/mecamocha_logo_1785676919844.jpg"
              alt="Mecamocha Coffee Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-orange-500/40 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-white font-bold tracking-tight text-base leading-tight font-sans">
                MECAMOCHA
              </h1>
              <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Inventory System</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            System Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-100 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-600">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {isSuperAdmin ? 'Super Admin' : 'Staff Kitchen'}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Sync Active</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
