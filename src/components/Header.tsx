import React, { useState } from 'react';
import { Menu as MenuIcon, AlertTriangle, UserCheck, Plus, ShoppingBag, ChefHat, LogOut, Cloud, RefreshCw, Copy, Check, Info, Database } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  setIsOpenSidebar: (open: boolean) => void;
  onOpenQuickAction?: (action: 'purchase' | 'prepare' | 'production' | 'adjustment') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setIsOpenSidebar, onOpenQuickAction, onLogout }) => {
  const {
    users,
    currentUser,
    setCurrentUser,
    ingredients,
    isSyncing,
    lastSyncedAt,
    supabaseError,
    pushAllToSupabase,
    pullFromSupabase,
  } = useInventory();

  const [showRlsModal, setShowRlsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate critical stock count
  const criticalStockCount = ingredients.filter((i) => i.is_active && i.current_stock <= i.min_stock).length;

  const sqlFixCode = `-- JALANKAN DI SUPABASE SQL EDITOR UNTUK MEMBUKA AKSES SIMPAN/UPDATE DATA:

-- 1. Matikan RLS atau izinkan ALL (INSERT, UPDATE, DELETE) untuk anon/public:
ALTER TABLE public.ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- ATAU jika ingin tetap pakai RLS, ubah Policy Command di Supabase Dashboard dari SELECT menjadi ALL:
-- 1. Buka Supabase Dashboard -> Database -> Policies
-- 2. Pilih tabel 'ingredients', 'stock_movements', 'transactions'
-- 3. Klik Edit Policy -> Ubah "Policy Command" dari SELECT menjadi ALL.`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlFixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        {/* Supabase Sync Badge & Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => pushAllToSupabase()}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all ${
              isSyncing
                ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-wait'
                : supabaseError
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={
              supabaseError
                ? `Peringatan Sync: ${supabaseError}. Klik untuk dorong ulang data ke Supabase.`
                : `Supabase Terhubung. Terakhir sync: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Baru saja'}. Klik untuk Sync Manual.`
            }
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden md:inline font-medium">
              {isSyncing ? 'Syncing...' : supabaseError ? 'Sync Error' : 'Supabase Active'}
            </span>
          </button>

          <button
            onClick={() => setShowRlsModal(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md text-xs flex items-center gap-1 transition-colors"
            title="Petunjuk Supabase Fix (RLS Policy)"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline text-[11px] font-medium">Fix Supabase</span>
          </button>
        </div>

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

      {/* Supabase RLS Policy Fix Guidance Modal */}
      {showRlsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Solusi Supabase: Izin Edit/Simpan (RLS Policy)</h3>
                  <p className="text-xs text-slate-500">Penyebab data di Web tidak tersimpan / berubah di Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setShowRlsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">Mengapa Web belum bisa menambah/mengubah data Supabase?</p>
                  <p className="mt-1">
                    Di screenshot Supabase Anda, Policy untuk <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">public.ingredients</code> diset ke <strong>SELECT</strong> saja (Read Access).
                    Artinya Web <strong>hanya boleh membaca</strong>, tapi <strong>ditolak saat mau INSERT/UPDATE/DELETE</strong> stok atau transaksi baru!
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Cara 1: Ubah Policy di Dashboard Supabase (Tanpa Koding)</h4>
                <ol className="list-decimal list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li>Buka <strong>Supabase Dashboard</strong> → <strong>Database</strong> → <strong>Policies</strong></li>
                  <li>Cari tabel <code className="font-mono bg-slate-200 px-1 rounded">ingredients</code>, <code className="font-mono bg-slate-200 px-1 rounded">stock_movements</code>, dan <code className="font-mono bg-slate-200 px-1 rounded">transactions</code></li>
                  <li>Klik tombol <strong>Edit</strong> pada policy "Allow public read access"</li>
                  <li>Pada bagian <strong>Policy Command (for)</strong>: Ganti dari <span className="text-red-600 font-bold underline">SELECT</span> menjadi <span className="text-emerald-700 font-bold underline">ALL</span> (atau centang INSERT, UPDATE, DELETE).</li>
                  <li>Klik <strong>Save Policy</strong>. Selesai!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">Cara 2: Jalankan Script SQL di Supabase (Cepat 5 Detik)</h4>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin SQL Fix'}</span>
                  </button>
                </div>
                <p className="text-slate-500">
                  Buka tab <strong>SQL Editor</strong> di Supabase Dashboard Anda, tempelkan kode berikut lalu klik <strong>Run</strong>:
                </p>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto border border-slate-800">
{sqlFixCode}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  pushAllToSupabase();
                  setShowRlsModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition-colors"
              >
                Tes Sync Sekarang
              </button>
              <button
                onClick={() => setShowRlsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
