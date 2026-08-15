import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  FileText,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SearchableIngredientSelect } from '../Common/SearchableIngredientSelect';
import { formatNumber, formatDate, formatCurrency } from '../../utils/formatters';
import {
  exportDailyStockToExcel,
  exportDailyStockToPDF,
  exportLedgerToExcel,
  exportLedgerToPDF,
} from '../../utils/export';

export const ReportsView: React.FC = () => {
  const { ingredients, units, menus, transactions, getDailyStockReport, getIngredientLedger, pullFromSupabase, isSyncing } = useInventory();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab: Stock Report vs Ledger vs Sales Report
  const [reportTab, setReportTab] = useState<'daily' | 'ledger' | 'sales'>('daily');

  // Daily Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchFilter, setSearchFilter] = useState('');
  const [dailyCategoryFilter, setDailyCategoryFilter] = useState<'all' | string>('all');

  // Ledger State
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || '');

  // Menu Sales Report State
  const [salesDateFilter, setSalesDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [salesCustomDate, setSalesCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [salesSearchFilter, setSalesSearchFilter] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await pullFromSupabase();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getYYYYMMDD = (input?: string | Date | null): string => {
    if (!input) return new Date().toISOString().slice(0, 10);
    if (typeof input === 'string') {
      const matchIso = input.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (matchIso) {
        return `${matchIso[1]}-${matchIso[2].padStart(2, '0')}-${matchIso[3].padStart(2, '0')}`;
      }
    }
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return new Date().toISOString().slice(0, 10);
  };

  const todayYMD = getYYYYMMDD(new Date().toISOString());
  const yesterdayYMD = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getYYYYMMDD(d.toISOString());
  })();

  // Helper for category sorting priority: Kitchen = 1, Bar = 2, Others = 3
  const getCategoryPriority = (catName?: string) => {
    if (!catName) return 3;
    const lower = catName.toLowerCase();
    if (lower.includes('kitchen') || lower.includes('dapur')) return 1;
    if (lower.includes('bar') || lower.includes('minuman')) return 2;
    return 3;
  };

  const rawDailyReportData = getDailyStockReport(reportDate);

  const dailyReportData = useMemo(() => {
    return rawDailyReportData
      .filter((row) => {
        // Search filter
        const matchSearch =
          row.ingredient.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          row.ingredient.code.toLowerCase().includes(searchFilter.toLowerCase());
        if (!matchSearch) return false;

        // Category filter
        if (dailyCategoryFilter !== 'all') {
          const catName = row.category?.name?.toLowerCase() || '';
          if (dailyCategoryFilter === 'kitchen') {
            return catName.includes('kitchen') || catName.includes('dapur');
          }
          if (dailyCategoryFilter === 'bar') {
            return catName.includes('bar') || catName.includes('minuman');
          }
          return row.category?.id === dailyCategoryFilter || catName.includes(dailyCategoryFilter.toLowerCase());
        }

        return true;
      })
      .sort((a, b) => {
        // Priority: Kitchen (1) -> Bar (2) -> Others (3)
        const pA = getCategoryPriority(a.category?.name);
        const pB = getCategoryPriority(b.category?.name);
        if (pA !== pB) return pA - pB;

        // Compare category names first
        const catCompare = (a.category?.name || '').localeCompare(b.category?.name || '');
        if (catCompare !== 0) return catCompare;

        // Compare ingredient names A-Z
        return a.ingredient.name.localeCompare(b.ingredient.name, undefined, { sensitivity: 'base' });
      });
  }, [rawDailyReportData, searchFilter, dailyCategoryFilter]);

  const selectedIngredient = ingredients.find((i) => i.id === selectedIngredientId) || ingredients[0];
  const selectedUnit = units.find((u) => u.id === selectedIngredient?.unit_id) || ({ name: '-', abbreviation: '-' } as any);
  const ledgerMovements = getIngredientLedger(selectedIngredientId);

  // Menu Sales Report Data
  const menuSalesData = useMemo(() => {
    const map = new Map<string, { menuName: string; category: string; price: number; totalPortions: number; totalTrx: number; revenue: number }>();

    // Pre-populate with registered menus
    menus.forEach((m) => {
      map.set(m.id, {
        menuName: m.name,
        category: m.category,
        price: m.price || 0,
        totalPortions: 0,
        totalTrx: 0,
        revenue: 0,
      });
    });

    const prodTrxs = transactions.filter((t) => t.type === 'production');

    prodTrxs.forEach((t) => {
      const tYMD = getYYYYMMDD(t.transaction_date || t.created_at);
      if (salesDateFilter === 'today' && tYMD !== todayYMD) return;
      if (salesDateFilter === 'yesterday' && tYMD !== yesterdayYMD) return;
      if (salesDateFilter === 'custom' && salesCustomDate && tYMD !== salesCustomDate) return;

      const primaryMenuId = t.menu_id;
      if (primaryMenuId && map.has(primaryMenuId)) {
        const entry = map.get(primaryMenuId)!;
        const portions = Number(t.portion_count) || 1;
        entry.totalPortions += portions;
        entry.totalTrx += 1;
        entry.revenue += portions * entry.price;
      }
    });

    return Array.from(map.entries()).map(([id, data]) => ({
      id,
      ...data,
    })).filter((item) => {
      if (salesSearchFilter.trim()) {
        const q = salesSearchFilter.toLowerCase();
        return item.menuName.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.totalPortions - a.totalPortions);
  }, [menus, transactions, salesDateFilter, salesCustomDate, salesSearchFilter, todayYMD, yesterdayYMD]);

  const totalPortionsAll = menuSalesData.reduce((sum, item) => sum + item.totalPortions, 0);
  const totalRevenueAll = menuSalesData.reduce((sum, item) => sum + item.revenue, 0);
  const topSellingItem = menuSalesData.length > 0 && menuSalesData[0].totalPortions > 0 ? menuSalesData[0] : null;

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportTab === 'daily'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Laporan Stok Harian (Daily Report)
          </button>
          <button
            onClick={() => setReportTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportTab === 'ledger'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Mutasi Stok (Stock Ledger)
          </button>
          <button
            onClick={() => setReportTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportTab === 'sales'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Laporan Penjualan Menu
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 border border-stone-300"
          title="Refresh Data dari Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isSyncing ? 'animate-spin text-amber-800' : 'text-stone-600'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* REPORT 1: DAILY STOCK REPORT */}
      {reportTab === 'daily' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Tanggal:</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="text-xs font-bold text-stone-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setDailyCategoryFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    dailyCategoryFilter === 'all'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setDailyCategoryFilter('kitchen')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    dailyCategoryFilter === 'kitchen'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Kitchen
                </button>
                <button
                  onClick={() => setDailyCategoryFilter('bar')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    dailyCategoryFilter === 'bar'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Bar
                </button>
              </div>

              <div className="relative flex-1 min-w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari bahan..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Export & Refresh Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isSyncing ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={() => exportDailyStockToExcel(dailyReportData, reportDate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button
                onClick={() => exportDailyStockToPDF(dailyReportData, reportDate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Bahan</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Satuan</th>
                    <th className="p-3 text-right">Stok Awal</th>
                    <th className="p-3 text-right bg-emerald-50/50 text-emerald-800">In (Beli)</th>
                    <th className="p-3 text-right bg-blue-50/50 text-blue-800">In (Prep)</th>
                    <th className="p-3 text-right bg-blue-50/50 text-blue-800">Out (Prep)</th>
                    <th className="p-3 text-right bg-amber-50/50 text-amber-800">Out (Prod)</th>
                    <th className="p-3 text-right bg-purple-50/50 text-purple-800">Adj (+/-)</th>
                    <th className="p-3 text-right font-bold text-stone-900 bg-stone-100">Stok Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {dailyReportData.map((row) => {
                    const catName = row.category?.name || '-';
                    const isKitchen = catName.toLowerCase().includes('kitchen') || catName.toLowerCase().includes('dapur');
                    const isBar = catName.toLowerCase().includes('bar') || catName.toLowerCase().includes('minuman');

                    return (
                      <tr key={row.ingredient.id} className="hover:bg-stone-50">
                        <td className="p-3 font-semibold text-stone-700">{row.ingredient.code}</td>
                        <td className="p-3 font-sans font-bold text-stone-900">{row.ingredient.name}</td>
                        <td className="p-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isKitchen
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : isBar
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-stone-100 text-stone-700 border-stone-300'
                            }`}
                          >
                            {catName}
                          </span>
                        </td>
                        <td className="p-3 font-sans text-stone-600">{row.unit?.abbreviation || '-'}</td>
                      <td className="p-3 text-right font-medium text-stone-600">
                        {formatNumber(row.initial_stock)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 bg-emerald-50/20">
                        +{formatNumber(row.in_purchase)}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/20">
                        +{formatNumber(row.in_prepare)}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700 bg-blue-50/20">
                        -{formatNumber(row.out_prepare)}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700 bg-amber-50/20">
                        -{formatNumber(row.out_production)}
                      </td>
                      <td className="p-3 text-right font-semibold text-purple-800 bg-purple-50/20">
                        {row.in_adjustment - row.out_adjustment >= 0 ? '+' : ''}
                        {formatNumber(row.in_adjustment - row.out_adjustment)}
                      </td>
                      <td className={`p-3 text-right font-extrabold ${row.final_stock < 0 ? 'text-red-600 bg-rose-50 font-mono' : 'text-stone-900 bg-stone-50'}`}>
                        {formatNumber(row.final_stock)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: STOCK LEDGER */}
      {reportTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-stone-800 shrink-0">Pilih Bahan Baku:</label>
              <SearchableIngredientSelect
                ingredients={ingredients}
                value={selectedIngredientId}
                onChange={(newId) => setSelectedIngredientId(newId)}
                className="w-full sm:w-72"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  selectedIngredient && exportLedgerToExcel(ledgerMovements, selectedIngredient, selectedUnit)
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button
                onClick={() =>
                  selectedIngredient && exportLedgerToPDF(ledgerMovements, selectedIngredient, selectedUnit)
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif">
                  Buku Besar / Kartu Stok: {selectedIngredient?.name}
                </h3>
                <p className="text-xs text-stone-500">
                  Kode: {selectedIngredient?.code} | Satuan: {selectedUnit.name} ({selectedUnit.abbreviation})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 block">Saldo Stok Akhir</span>
                <span className="text-xl font-extrabold text-amber-900 font-serif">
                  {formatNumber(selectedIngredient?.current_stock)} {selectedUnit.abbreviation}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Tanggal / Waktu</th>
                    <th className="p-3.5">Tipe Mutasi</th>
                    <th className="p-3.5 text-right">Jumlah (Qty)</th>
                    <th className="p-3.5 text-right">Saldo Setelah</th>
                    <th className="p-3.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {ledgerMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-500 font-sans">
                        Belum ada riwayat mutasi untuk bahan baku ini.
                      </td>
                    </tr>
                  ) : (
                    ledgerMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-stone-50">
                        <td className="p-3.5 text-stone-600">{formatDate(m.created_at, true)}</td>
                        <td className="p-3.5 font-sans">
                          {m.type === 'in' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <ArrowDownRight className="w-3.5 h-3.5" /> Masuk (+)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Keluar (-)
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-3.5 text-right font-bold ${
                            m.type === 'in' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {m.type === 'in' ? '+' : '-'}
                          {formatNumber(m.quantity)} {selectedUnit.abbreviation}
                        </td>
                        <td className={`p-3.5 text-right font-extrabold ${m.balance_after < 0 ? 'text-red-600 font-mono' : 'text-stone-900'}`}>
                          {formatNumber(m.balance_after)} {selectedUnit.abbreviation}
                        </td>
                        <td className="p-3.5 font-sans text-stone-700">{m.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: MENU SALES REPORT */}
      {reportTab === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-amber-100 text-amber-800 rounded-xl">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">Total Porsi Terjual</span>
                <div className="text-2xl font-extrabold text-stone-900 font-mono mt-0.5">
                  {formatNumber(totalPortionsAll)} <span className="text-xs font-sans text-stone-500 font-semibold">Porsi</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">Estimasi Nilai Omset</span>
                <div className="text-2xl font-extrabold text-emerald-900 font-mono mt-0.5">
                  {formatCurrency(totalRevenueAll)}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-purple-100 text-purple-800 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium">Menu Terlaris (Top Selling)</span>
                <div className="text-lg font-bold text-stone-900 font-serif mt-0.5 truncate max-w-48">
                  {topSellingItem ? topSellingItem.menuName : '-'}
                </div>
                {topSellingItem && (
                  <span className="text-xs text-purple-700 font-semibold">
                    {formatNumber(topSellingItem.totalPortions)} porsi terjual
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setSalesDateFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    salesDateFilter === 'all'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setSalesDateFilter('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    salesDateFilter === 'today'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setSalesDateFilter('yesterday')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    salesDateFilter === 'yesterday'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Kemarin
                </button>
                <button
                  onClick={() => setSalesDateFilter('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    salesDateFilter === 'custom'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Pilih Tanggal
                </button>
              </div>

              {salesDateFilter === 'custom' && (
                <input
                  type="date"
                  value={salesCustomDate}
                  onChange={(e) => setSalesCustomDate(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama menu..."
                value={salesSearchFilter}
                onChange={(e) => setSalesSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Sales Report Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Nama Menu Jualan</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-right">Harga Per Porsi</th>
                    <th className="p-3.5 text-right">Porsi Terjual</th>
                    <th className="p-3.5 text-right">Jumlah Transaksi</th>
                    <th className="p-3.5 text-right">Estimasi Total Omset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {menuSalesData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500 italic">
                        Belum ada data penjualan menu pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    menuSalesData.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-bold text-stone-900 font-serif text-sm">
                          {item.menuName}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-stone-700 font-semibold">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-900">
                          {formatNumber(item.totalPortions)} porsi
                        </td>
                        <td className="p-3.5 text-right font-mono text-stone-600">
                          {formatNumber(item.totalTrx)} kali
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-emerald-900">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
