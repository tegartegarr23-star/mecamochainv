import React from 'react';
import { Menu as MenuIcon, AlertTriangle, UserCheck, Plus, ShoppingBag, ChefHat, ArrowUpRight, ShieldCheck, LogOut } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  setIsOpenSidebar: (open: boolean) => void;
  onOpenQuickAction?: (action: 'purchase' | 'prepare' | 'production' | 'adjustment') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setIsOpenSidebar, onOpenQuickAction, onLogout }) => {
  const { users, currentUser, setCurrentUser, ingredients } = useInventory();

  // Calculate critical stock count
  const criticalStockCount = ingredients.filter((i) => i.is_active && i.current_stock <= i.min_stock).length;

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Inventaris',
      subtitle: 'Ringkasan stok bahan, aktivitas transaksi, dan stok kritis hari ini',
    },
    ingredients: {
      title: 'Master Bahan Baku & Data',
      subtitle: 'Kelola master bahan mentah (Raw), bahan setengah jadi (PP), satuan, supplier & kategori',
    },
    menus: {
      title: 'Master Menu / Produk',
      subtitle: 'Daftar menu Mecamocha dan harga jual',
    },
    recipes: {
      title: 'Manajemen Resep & BOM',
      subtitle: 'Kelola formula resep (Bill of Materials) & versi resep per porsi menu',
    },
    transactions: {
      title: 'Transaksi & Pergerakan Stok',
      subtitle: 'Catat Pembelian, Konversi Prepare, Produksi Menu, & Penyesuaian Stok',
    },
    reports: {
      title: 'Laporan Stok & Mutasi',
      subtitle: 'Rekap stok harian dan buku besar mutasi per bahan baku (Ledger)',
    },
    users: {
      title: 'Manajemen User & Hak Akses',
      subtitle: 'Kelola pengguna sistem dan hak akses khusus Super Admin',
    },
  };

  const currentInfo = tabTitles[activeTab] || { title: 'Mecamocha Inventory', subtitle: 'F&B Management' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shrink-0 shadow-2xs">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenSidebar(true)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Buka Menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight tracking-tight">{currentInfo.title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">{currentInfo.subtitle}</p>
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons */}
        {onOpenQuickAction && (
          <div className="hidden xl:flex items-center gap-2">
            <button
              onClick={() => onOpenQuickAction('purchase')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-semibold transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> + Pembelian
            </button>
            <button
              onClick={() => onOpenQuickAction('prepare')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5" /> + Prepare (PP)
            </button>
            <button
              onClick={() => onOpenQuickAction('production')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Transaksi Baru
            </button>
          </div>
        )}

        {/* Critical Stock Alert Badge */}
        {criticalStockCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            title={`${criticalStockCount} bahan baku dalam batas stok kritis`}
          >
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="font-bold">{criticalStockCount}</span>
            <span className="hidden sm:inline">Stok Kritis</span>
          </div>
        )}

        {/* Logged-in User Profile Badge */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
            currentUser.role === 'super_admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {currentUser.role === 'super_admin' ? 'Super Admin' : 'Staff'}
          </span>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-200 hover:border-red-200 rounded-md text-xs font-semibold transition-colors"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
