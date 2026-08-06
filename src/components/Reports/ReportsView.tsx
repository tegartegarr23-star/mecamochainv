import React, { useState } from 'react';
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
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  exportDailyStockToExcel,
  exportDailyStockToPDF,
  exportLedgerToExcel,
  exportLedgerToPDF,
} from '../../utils/export';

export const ReportsView: React.FC = () => {
  const { ingredients, units, getDailyStockReport, getIngredientLedger, pullFromSupabase, isSyncing } = useInventory();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab: Stock Report vs Ledger
  const [reportTab, setReportTab] = useState<'daily' | 'ledger'>('daily');

  // Daily Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchFilter, setSearchFilter] = useState('');

  // Ledger State
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || '');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await pullFromSupabase();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const dailyReportData = getDailyStockReport(reportDate).filter((row) =>
    row.ingredient.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    row.ingredient.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedIngredient = ingredients.find((i) => i.id === selectedIngredientId) || ingredients[0];
  const selectedUnit = units.find((u) => u.id === selectedIngredient?.unit_id) || ({ name: '-', abbreviation: '-' } as any);
  const ledgerMovements = getIngredientLedger(selectedIngredientId);

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-3">
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
                  {dailyReportData.map((row) => (
                    <tr key={row.ingredient.id} className="hover:bg-stone-50">
                      <td className="p-3 font-semibold text-stone-700">{row.ingredient.code}</td>
                      <td className="p-3 font-sans font-bold text-stone-900">{row.ingredient.name}</td>
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
                  ))}
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
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-stone-800">Pilih Bahan Baku:</label>
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
              >
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.code}] {i.name} (Stok Saat Ini: {formatNumber(i.current_stock)})
                  </option>
                ))}
              </select>
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
    </div>
  );
};
