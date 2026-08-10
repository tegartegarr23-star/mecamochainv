import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  ShoppingBag,
  ChefHat,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  FileText,
  User,
  Building,
  Trash2,
  Sparkles,
  Info,
  Eye,
  X,
  Search,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SearchableIngredientSelect } from '../Common/SearchableIngredientSelect';
import {
  TransactionType,
  PurchaseItemInput,
  PrepareItemInput,
  Transaction,
} from '../../types';
import { formatNumber, formatCurrency, formatDate, generateRefNo } from '../../utils/formatters';

interface TransactionsViewProps {
  initialAction?: 'purchase' | 'prepare' | 'production' | 'adjustment';
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ initialAction }) => {
  const {
    suppliers,
    ingredients,
    units,
    menus,
    transactions,
    stockMovements,
    addPurchaseTransaction,
    addPrepareTransaction,
    checkProductionSufficiency,
    addProductionTransaction,
    addAdjustmentTransaction,
    deleteTransaction,
    clearAllTransactions,
    getPrepareFormula,
    savePrepareFormula,
  } = useInventory();

  // Active Tab: History vs New Transaction Forms
  const [activeTab, setActiveTab] = useState<'purchase' | 'prepare' | 'production' | 'adjustment' | 'history'>(
    initialAction || 'production'
  );

  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'purchase' | 'prepare' | 'production' | 'adjustment'>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [historySelectedDate, setHistorySelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  const [selectedTrxForDetail, setSelectedTrxForDetail] = useState<Transaction | null>(null);
  const [selectedTrxForDelete, setSelectedTrxForDelete] = useState<Transaction | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAction) {
      setActiveTab(initialAction);
    }
  }, [initialAction]);

  // Helper for quick date selection (Hari Ini, Kemarin, 2 Hari Lalu)
  const getDateDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const renderQuickDatePicker = (
    label: string,
    value: string,
    onChange: (val: string) => void
  ) => {
    const today = getDateDaysAgo(0);
    const yesterday = getDateDaysAgo(1);
    const twoDaysAgo = getDateDaysAgo(2);

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-stone-700">{label}</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(today)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                value === today
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => onChange(yesterday)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                value === yesterday
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => onChange(twoDaysAgo)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                value === twoDaysAgo
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              2 Hari Lalu
            </button>
          </div>
        </div>
        <input
          type="date"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold text-stone-900 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
    );
  };

  // FORM STATES

  // 1. Purchase Form State
  const [purDate, setPurDate] = useState(new Date().toISOString().slice(0, 10));
  const [purSupplierId, setPurSupplierId] = useState(suppliers[0]?.id || '');
  const [purRefNo, setPurRefNo] = useState(generateRefNo('PUR'));
  const [purNotes, setPurNotes] = useState('');
  const [purItems, setPurItems] = useState<PurchaseItemInput[]>([
    { ingredient_id: ingredients[0]?.id || '', quantity: 1000, unit_price: 50 },
  ]);

  // 2. Prepare Form State
  const preparedIngredients = ingredients.filter((i) => i.type === 'prepared');
  const [prepDate, setPrepDate] = useState(new Date().toISOString().slice(0, 10));
  const [prepRefNo, setPrepRefNo] = useState(generateRefNo('PREP'));
  const [prepNotes, setPrepNotes] = useState('');
  const [prepTargetIngId, setPrepTargetIngId] = useState<string>(preparedIngredients[0]?.id || ingredients[0]?.id || '');
  const [prepTargetQty, setPrepTargetQty] = useState<number>(1000);
  const [prepItems, setPrepItems] = useState<PrepareItemInput[]>([
    { ingredient_id: preparedIngredients[0]?.id || ingredients[0]?.id || '', quantity: 1000, is_target: true },
  ]);

  const lastValidTargetQty = useRef<number>(1000);

  // Load / Sync Prepare Formula Template ONLY when Target PP ingredient changes
  useEffect(() => {
    if (!prepTargetIngId) return;
    const { details } = getPrepareFormula(prepTargetIngId);

    const baseQty = 1000;
    setPrepTargetQty(baseQty);
    lastValidTargetQty.current = baseQty;

    if (details && details.length > 0) {
      const sourceItems: PrepareItemInput[] = details.map((d) => ({
        ingredient_id: d.ingredient_id,
        quantity: Math.round(Number(d.quantity) * 100) / 100,
        is_target: false,
      }));
      setPrepItems([
        { ingredient_id: prepTargetIngId, quantity: baseQty, is_target: true },
        ...sourceItems,
      ]);
    } else {
      const defaultRaw = ingredients.find((i) => i.type === 'raw');
      setPrepItems([
        { ingredient_id: prepTargetIngId, quantity: baseQty, is_target: true },
        ...(defaultRaw ? [{ ingredient_id: defaultRaw.id, quantity: baseQty, is_target: false }] : []),
      ]);
    }
  }, [prepTargetIngId]);

  const handleTargetQtyChange = (newVal: number) => {
    setPrepTargetQty(newVal);

    if (newVal > 0 && lastValidTargetQty.current > 0) {
      const factor = newVal / lastValidTargetQty.current;
      setPrepItems((prev) =>
        prev.map((item) => {
          if (item.is_target) {
            return { ...item, ingredient_id: prepTargetIngId, quantity: newVal };
          }
          return {
            ...item,
            quantity: Math.round(item.quantity * factor * 100) / 100,
          };
        })
      );
      lastValidTargetQty.current = newVal;
    } else if (newVal === 0) {
      setPrepItems((prev) =>
        prev.map((item) => (item.is_target ? { ...item, quantity: 0 } : item))
      );
    }
  };

  const handleSavePrepareFormula = () => {
    if (!prepTargetIngId) return;
    const sourceItems = prepItems.filter((i) => !i.is_target && i.ingredient_id && i.quantity > 0);
    if (sourceItems.length === 0) {
      alert('Pilih minimal 1 bahan mentah pendukung untuk disimpan dalam formula!');
      return;
    }

    const scaleFactor = prepTargetQty > 0 ? prepTargetQty / 1000 : 1;
    const formulaDetails = sourceItems.map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: scaleFactor > 0 ? item.quantity / scaleFactor : item.quantity,
    }));

    const targetIng = ingredients.find((i) => i.id === prepTargetIngId);
    savePrepareFormula(prepTargetIngId, formulaDetails);
    alert(`Formula resep standar untuk "${targetIng?.name || 'Bahan Prepare'}" berhasil disimpan! Setiap kali Anda memilih bahan ini, komposisinya akan terisi otomatis.`);
  };

  // 3. Production Form State
  const [prodDate, setProdDate] = useState(new Date().toISOString().slice(0, 10));
  const [prodMenuId, setProdMenuId] = useState(menus[0]?.id || '');
  const [prodPortions, setProdPortions] = useState(10);
  const [prodRefNo, setProdRefNo] = useState(generateRefNo('PROD'));
  const [prodNotes, setProdNotes] = useState('');
  const [prodMessage, setProdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live calculation of stock sufficiency for production
  const productionSufficiency = checkProductionSufficiency(prodMenuId, prodPortions);

  // 4. Adjustment Form State
  const [adjDate, setAdjDate] = useState(new Date().toISOString().slice(0, 10));
  const [adjIngredientId, setAdjIngredientId] = useState('');
  const [adjQty, setAdjQty] = useState<number | ''>('');
  const [adjMode, setAdjMode] = useState<'plus' | 'minus' | 'set'>('minus');
  const [adjReason, setAdjReason] = useState<'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other'>('Damage');
  const [adjNotes, setAdjNotes] = useState('');

  useEffect(() => {
    if (ingredients.length > 0 && (!adjIngredientId || !ingredients.some((i) => i.id === adjIngredientId))) {
      setAdjIngredientId(ingredients[0].id);
    }
  }, [ingredients, adjIngredientId]);

  // Submit Purchase
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purItems.length === 0) return;

    addPurchaseTransaction(purDate, purSupplierId, purRefNo, purNotes, purItems);
    alert('Transaksi Pembelian berhasil disimpan. Stok bahan baku bertambah!');
    setPurRefNo(generateRefNo('PUR'));
    setPurNotes('');
    setActiveTab('history');
  };

  // Submit Prepare
  const handlePrepareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prepItems.length === 0) return;

    addPrepareTransaction(prepDate, prepRefNo, prepNotes, prepItems);
    alert('Proses Prepare / Konversi berhasil disimpan. Stok bahan telah diperbarui!');
    setPrepRefNo(generateRefNo('PREP'));
    setPrepNotes('');
    setActiveTab('history');
  };

  // Submit Production
  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addProductionTransaction(prodDate, prodMenuId, prodPortions, prodRefNo, prodNotes);

    if (res.success) {
      setProdMessage({ type: 'success', text: res.message });
      setProdRefNo(generateRefNo('PROD'));
      setProdNotes('');
      setTimeout(() => {
        setProdMessage(null);
        setActiveTab('history');
      }, 1500);
    } else {
      setProdMessage({ type: 'error', text: res.message });
    }
  };

  // Submit Adjustment
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetIngId = adjIngredientId || ingredients[0]?.id || '';
    const numQty = Number(adjQty);
    if (!targetIngId) {
      alert('Pilih bahan baku terlebih dahulu.');
      return;
    }
    if (adjQty === '' || isNaN(numQty) || numQty < 0) {
      alert('Masukkan kuantitas penyesuaian yang valid.');
      return;
    }

    addAdjustmentTransaction(adjDate, targetIngId, numQty, adjMode, adjReason, adjNotes);
    alert('Penyesuaian stok berhasil disimpan!');
    setAdjQty('');
    setAdjNotes('');
    setActiveTab('history');
  };

  const getYYYYMMDD = (input?: string): string => {
    if (!input) return '';
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input).slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayYMD = getYYYYMMDD(new Date().toISOString());
  const yesterdayYMD = getDateDaysAgo(1);

  const filteredTransactions = transactions.filter((t) => {
    if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;

    const tYMD = getYYYYMMDD(t.transaction_date);
    if (historyDateFilter === 'today' && tYMD !== todayYMD) return false;
    if (historyDateFilter === 'yesterday' && tYMD !== yesterdayYMD) return false;
    if (historyDateFilter === 'custom' && historySelectedDate && tYMD !== historySelectedDate) return false;

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchRef = t.reference_no?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchCreator = t.created_by?.toLowerCase().includes(q);
      if (!matchRef && !matchNotes && !matchCreator) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Transaction Forms Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'production'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400" /> Produksi / Penjualan Menu
          </button>
          <button
            onClick={() => setActiveTab('prepare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'prepare'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ChefHat className="w-4 h-4 text-blue-300" /> Prepare (Konversi PP)
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'purchase'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-300" /> Pembelian
          </button>
          <button
            onClick={() => setActiveTab('adjustment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'adjustment'
                ? 'bg-purple-800 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-300" /> Penyesuaian
          </button>
        </div>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeTab === 'history'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Riwayat Transaksi ({transactions.length})
        </button>
      </div>

      {/* FORM 1: PRODUKSI MENU (PRODUCTION) */}
      {activeTab === 'production' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Form (1 col) */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif">Pencatatan Produksi Menu</h3>
                <p className="text-xs text-stone-500">Stok bahan baku terpotong otomatis berdasarkan resep</p>
              </div>
            </div>

            {prodMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  prodMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {prodMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{prodMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProductionSubmit} className="space-y-4">
              {renderQuickDatePicker('Tanggal Produksi', prodDate, setProdDate)}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pilih Menu / Produk</label>
                <select
                  value={prodMenuId}
                  onChange={(e) => setProdMenuId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Jumlah Porsi Diproduksi</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={prodPortions}
                  onChange={(e) => setProdPortions(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">No. Referensi / Batch</label>
                <input
                  type="text"
                  required
                  value={prodRefNo}
                  onChange={(e) => setProdRefNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Batch Pagi 10 Porsi"
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={productionSufficiency.items.length === 0}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                  productionSufficiency.items.length === 0
                    ? 'bg-stone-300 cursor-not-allowed'
                    : productionSufficiency.isSufficient
                    ? 'bg-amber-800 hover:bg-amber-900'
                    : 'bg-amber-700 hover:bg-amber-800'
                }`}
              >
                {productionSufficiency.items.length === 0
                  ? 'Resep Belum Dikonfigurasi'
                  : productionSufficiency.isSufficient
                  ? 'Proses & Potong Stok Otomatis'
                  : 'Proses & Potong Stok (Stok Akan Minus)'}
              </button>
            </form>
          </div>

          {/* Right: Live Stock Sufficiency Check Table (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                  Estimasi Kecukupan Stok Bahan
                </h3>
                <p className="text-xs text-stone-500">
                  Perhitungan takaran resep x {prodPortions} porsi terhadap stok gudang saat ini
                </p>
              </div>

              {productionSufficiency.isSufficient ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Stok Sangat Cukup
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Stok Kurang (Minus)
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Nama Bahan Baku</th>
                    <th className="p-3 text-right">Dibutuhkan ({prodPortions} porsi)</th>
                    <th className="p-3 text-right">Stok Saat Ini</th>
                    <th className="p-3 text-center">Status Kecukupan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {productionSufficiency.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-stone-500 italic">
                        Resep untuk menu ini belum dikonfigurasi.
                      </td>
                    </tr>
                  ) : (
                    productionSufficiency.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className={item.isShortage ? 'bg-rose-50/50' : 'hover:bg-stone-50'}
                      >
                        <td className="p-3 font-bold text-stone-900">{item.ingredient.name}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-900">
                          {formatNumber(item.requiredQty)} {item.unit?.abbreviation}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-stone-700">
                          {formatNumber(item.currentStock)} {item.unit?.abbreviation}
                        </td>
                        <td className="p-3 text-center">
                          {item.isShortage ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              Kurang {formatNumber(item.missingQty)} {item.unit?.abbreviation}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Cukup
                            </span>
                          )}
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

      {/* FORM 2: PREPARE (KONVERSI BAHAN SEMENTARA / PP) */}
      {activeTab === 'prepare' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Proses Prepare / Konversi Bahan</h3>
              <p className="text-xs text-stone-500">
                Pilih bahan setengah jadi (PP) & target jumlah diproduksi. Komposisi resep akan terisi otomatis dan dapat disesuaikan.
              </p>
            </div>
          </div>

          <form onSubmit={handlePrepareSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderQuickDatePicker('Tanggal Prepare', prepDate, setPrepDate)}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">No. Referensi</label>
                <input
                  type="text"
                  required
                  value={prepRefNo}
                  onChange={(e) => setPrepRefNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Prepare marinasi dada ayam 2kg"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Target Prepared Item Selection */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-700" /> Target Bahan Setengah Jadi (PP) Yang Diproduksi
                </span>
                <span className="text-[11px] font-medium text-blue-700">Auto-fill dari formula resep PP</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Pilih Bahan PP</label>
                  <select
                    value={prepTargetIngId}
                    onChange={(e) => setPrepTargetIngId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-stone-900 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ingredients
                      .filter((i) => i.type === 'prepared' || i.is_active)
                      .map((i) => {
                        const unit = units.find((u) => u.id === i.unit_id);
                        return (
                          <option key={i.id} value={i.id}>
                            [{i.type === 'raw' ? 'Mentah' : 'PP Prepare'}] {i.name} (Stok Saat Ini: {formatNumber(i.current_stock)} {unit?.abbreviation || ''})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Jumlah Hasil Diproduksi</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      value={prepTargetQty === 0 ? '' : prepTargetQty}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const val = rawVal === '' ? 0 : Number(rawVal);
                        handleTargetQtyChange(val);
                      }}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-stone-900 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-stone-600 min-w-12">
                      {units.find((u) => u.id === ingredients.find((i) => i.id === prepTargetIngId)?.unit_id)?.abbreviation || 'Unit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prepare Source Ingredients List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Komposisi Bahan Mentah Yang Digunakan</h4>
                  <p className="text-[11px] text-stone-500">Anda dapat mengubah jenis bahan atau jumlahnya di bawah ini</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePrepareFormula}
                    className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-bold transition-all flex items-center gap-1 border border-blue-300"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" /> Simpan Formula Standar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrepItems([
                        ...prepItems,
                        {
                          ingredient_id: ingredients.find((i) => i.type === 'raw')?.id || ingredients[0]?.id || '',
                          quantity: 100,
                          is_target: false,
                        },
                      ])
                    }
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Bahan
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {prepItems.map((item, idx) => {
                  const ing = ingredients.find((i) => i.id === item.ingredient_id);
                  const unit = units.find((u) => u.id === ing?.unit_id);

                  if (item.is_target) return null; // Target row shown in top header

                  const isStockNegative = ing && ing.current_stock < 0;

                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-rose-100 text-rose-900 border border-rose-300">
                        Keluar (-) Bahan Mentah
                      </span>

                      <SearchableIngredientSelect
                        ingredients={ingredients}
                        value={item.ingredient_id}
                        onChange={(newId) => {
                          const newItems = [...prepItems];
                          newItems[idx].ingredient_id = newId;
                          setPrepItems(newItems);
                        }}
                        className="flex-1 min-w-48"
                      />

                      <div className="w-36 flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Jumlah"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...prepItems];
                            newItems[idx].quantity = Number(e.target.value);
                            setPrepItems(newItems);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-white border border-stone-200 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-stone-500">{unit?.abbreviation}</span>
                      </div>

                      <div className="text-right min-w-28 text-[11px]">
                        <span className="block text-stone-400">Sisa Stok:</span>
                        <span className={`font-mono font-bold ${isStockNegative ? 'text-red-600 font-extrabold' : 'text-stone-700'}`}>
                          {ing ? formatNumber(ing.current_stock) : 0} {unit?.abbreviation || ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPrepItems(prepItems.filter((_, i) => i !== idx))}
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4" /> Simpan Transaksi Prepare & Potong Stok
            </button>
          </form>
        </div>
      )}

      {/* FORM 3: PEMBELIAN (PURCHASE) */}
      {activeTab === 'purchase' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Pencatatan Pembelian Bahan Baku</h3>
              <p className="text-xs text-stone-500">Menambah stok bahan mentah dari supplier</p>
            </div>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderQuickDatePicker('Tanggal Pembelian', purDate, setPurDate)}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pilih Supplier</label>
                <select
                  value={purSupplierId}
                  onChange={(e) => setPurSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">No. Invoice / Ref</label>
                <input
                  type="text"
                  required
                  value={purRefNo}
                  onChange={(e) => setPurRefNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Daftar Item Dibeli</h4>
                  <p className="text-[11px] text-stone-500">Masukkan jumlah stok yang dibeli dan harga beli per unit (Rp)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const firstIng = ingredients[0];
                    setPurItems([
                      ...purItems,
                      {
                        ingredient_id: firstIng?.id || '',
                        quantity: 100,
                        unit_price: firstIng?.cost_per_unit || 0,
                      },
                    ]);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Item
                </button>
              </div>

              {/* Table Header Labels */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                <div className="col-span-5">Bahan Baku</div>
                <div className="col-span-2 text-center">Jumlah (Qty)</div>
                <div className="col-span-2 text-center">Harga Satuan (Rp)</div>
                <div className="col-span-2 text-right">Subtotal (Rp)</div>
                <div className="col-span-1 text-center">Hapus</div>
              </div>

              <div className="space-y-2">
                {purItems.map((item, idx) => {
                  const ing = ingredients.find((i) => i.id === item.ingredient_id);
                  const unit = units.find((u) => u.id === ing?.unit_id);
                  const subtotal = (item.quantity || 0) * (item.unit_price || 0);

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      {/* Ingredient Select */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-semibold text-stone-500 sm:hidden mb-1">
                          Pilih Bahan Baku
                        </label>
                        <SearchableIngredientSelect
                          ingredients={ingredients}
                          value={item.ingredient_id}
                          onChange={(newIngId) => {
                            const selectedIng = ingredients.find((i) => i.id === newIngId);
                            const newItems = [...purItems];
                            newItems[idx].ingredient_id = newIngId;
                            if (selectedIng?.cost_per_unit) {
                              newItems[idx].unit_price = selectedIng.cost_per_unit;
                            }
                            setPurItems(newItems);
                          }}
                          className="w-full"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-stone-500 sm:hidden mb-1">
                          Jumlah (Qty)
                        </label>
                        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
                          <input
                            type="number"
                            step="any"
                            required
                            min="0.001"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...purItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setPurItems(newItems);
                            }}
                            className="w-full text-xs font-mono font-bold text-stone-900 focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-stone-500 shrink-0">
                            {unit?.abbreviation || 'unit'}
                          </span>
                        </div>
                      </div>

                      {/* Unit Price Input with Rp Prefix */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-stone-500 sm:hidden mb-1">
                          Harga Satuan (Rp)
                        </label>
                        <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                          <span className="px-2 py-1.5 text-[10px] font-bold text-stone-500 bg-stone-100 border-r border-stone-200 shrink-0">
                            Rp
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="Harga/Unit"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...purItems];
                              newItems[idx].unit_price = Number(e.target.value);
                              setPurItems(newItems);
                            }}
                            className="w-full px-2 py-1.5 text-xs font-mono font-bold text-stone-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Subtotal Display */}
                      <div className="sm:col-span-2 text-right">
                        <span className="text-[10px] text-stone-400 sm:hidden">Subtotal: </span>
                        <span className="text-xs font-extrabold text-emerald-900 font-mono">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => setPurItems(purItems.filter((_, i) => i !== idx))}
                          disabled={purItems.length <= 1}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Purchase Total Summary */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-xs font-semibold text-emerald-900">
                  Total {purItems.length} Item Bahan Baku Dibeli
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 font-medium block">Total Estimasi Biaya Pembelian</span>
                  <span className="text-base font-extrabold text-emerald-900 font-mono">
                    {formatCurrency(
                      purItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unit_price || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md"
            >
              Simpan Pembelian & Tambah Stok
            </button>
          </form>
        </div>
      )}

      {/* FORM 4: ADJUSTMENT */}
      {activeTab === 'adjustment' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-800">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-serif">Penyesuaian Stok Manual</h3>
              <p className="text-xs text-stone-500">Penyesuaian akibat kerusakan, expired, opname, atau loss</p>
            </div>
          </div>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {renderQuickDatePicker('Tanggal Penyesuaian', adjDate, setAdjDate)}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tipe Penyesuaian</label>
                <select
                  value={adjMode}
                  onChange={(e) => setAdjMode(e.target.value as 'plus' | 'minus' | 'set')}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="set">Set Stok Fisik (Opname Langsung)</option>
                  <option value="minus">Keluar (-) Penurunan Stok</option>
                  <option value="plus">Masuk (+) Penambahan Stok</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pilih Bahan Baku</label>
              <SearchableIngredientSelect
                ingredients={ingredients}
                value={adjIngredientId}
                onChange={(newId) => setAdjIngredientId(newId)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {adjMode === 'set' ? 'Jumlah Stok Fisik Hasil Opname' : 'Kuantitas Penyesuaian'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={adjMode === 'set' ? "Total stok fisik hasil opname" : "Kuantitas"}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Alasan Penyesuaian</label>
                <select
                  value={adjReason}
                  onChange={(e) => {
                    const r = e.target.value as 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other';
                    setAdjReason(r);
                    if (r === 'Stock Opname') {
                      setAdjMode('set');
                    } else if (r === 'Damage' || r === 'Expired' || r === 'Loss') {
                      setAdjMode('minus');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="Damage">Damage (Kerusakan)</option>
                  <option value="Expired">Expired (Kadaluwarsa)</option>
                  <option value="Loss">Loss (Kehilangan)</option>
                  <option value="Stock Opname">Stock Opname (Hasil Cek Fisik)</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Live Preview Calculation */}
            {(() => {
              const currentIng = ingredients.find((i) => i.id === adjIngredientId) || ingredients[0];
              if (!currentIng) return null;

              const numQty = Number(adjQty) || 0;
              const currentStock = Number(currentIng.current_stock) || 0;

              const targetStock =
                adjMode === 'set'
                  ? numQty
                  : adjMode === 'plus'
                  ? currentStock + numQty
                  : Math.max(0, currentStock - numQty);

              const diff = targetStock - currentStock;

              return (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium">
                  <div className="font-bold flex justify-between">
                    <span>Pratinjau Hasil Adjustment:</span>
                    <span>{currentIng.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-stone-700">
                    <span>
                      Stok Lama: <strong>{formatNumber(currentIng.current_stock)}</strong>
                    </span>
                    <span>➔</span>
                    <span>
                      Stok Baru:{' '}
                      <strong className="text-purple-800 font-extrabold text-sm font-mono">
                        {formatNumber(targetStock)}
                      </strong>
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-purple-700">
                    Perubahan Mutasi: {diff >= 0 ? '+' : ''}
                    {formatNumber(diff)}
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Keterangan / Notes</label>
              <input
                type="text"
                placeholder="Detail alasan penyesuaian stok..."
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-md"
            >
              Simpan Penyesuaian Stok
            </button>
          </form>
        </div>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm font-serif">Riwayat Transaksi Inventaris</h3>
                <p className="text-xs text-stone-500">Filter transaksi berdasarkan jenis & tanggal untuk mempermudah audit</p>
              </div>
              <span className="text-xs text-stone-500 font-bold bg-stone-100 px-3 py-1 rounded-full">
                Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
              </span>
            </div>

            {/* Filter Controls Bar */}
            <div className="p-3 bg-stone-50/80 border-b border-stone-200 space-y-2.5">
              {/* Row 1: Filter Tanggal & Search */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 mr-1">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal:
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      historyDateFilter === 'all'
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    Semua Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter('today')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      historyDateFilter === 'today'
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter('yesterday')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      historyDateFilter === 'yesterday'
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    Kemarin
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHistoryDateFilter('custom')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        historyDateFilter === 'custom'
                          ? 'bg-amber-800 text-white shadow-2xs'
                          : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      Pilih Tanggal:
                    </button>
                    <input
                      type="date"
                      value={historySelectedDate}
                      onChange={(e) => {
                        setHistorySelectedDate(e.target.value);
                        setHistoryDateFilter('custom');
                      }}
                      className="px-2 py-0.5 text-xs rounded-lg bg-white border border-stone-200 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Search box */}
                <div className="relative min-w-[200px] flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Cari ref, catatan..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-white border border-stone-200 focus:outline-none focus:border-amber-700"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Type Sub-tabs & Kosongkan Button */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60">
                <button
                  onClick={() => setHistoryTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    historyTypeFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  Semua ({transactions.length})
                </button>
                <button
                  onClick={() => setHistoryTypeFilter('purchase')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    historyTypeFilter === 'purchase'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  🛒 Pembelian ({transactions.filter((t) => t.type === 'purchase').length})
                </button>
                <button
                  onClick={() => setHistoryTypeFilter('prepare')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    historyTypeFilter === 'prepare'
                      ? 'bg-blue-800 text-white shadow-2xs'
                      : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  🍳 Prepare ({transactions.filter((t) => t.type === 'prepare').length})
                </button>
                <button
                  onClick={() => setHistoryTypeFilter('production')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    historyTypeFilter === 'production'
                      ? 'bg-amber-800 text-white shadow-2xs'
                      : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                  }`}
                >
                  🍲 Produksi ({transactions.filter((t) => t.type === 'production').length})
                </button>
                <button
                  onClick={() => setHistoryTypeFilter('adjustment')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    historyTypeFilter === 'adjustment'
                      ? 'bg-purple-800 text-white shadow-2xs'
                      : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
                  }`}
                >
                  ⚖️ Penyesuaian ({transactions.filter((t) => t.type === 'adjustment').length})
                </button>

                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearAllModal(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 ml-auto"
                    title="Hapus seluruh riwayat transaksi"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kosongkan Riwayat</span>
                  </button>
                )}
              </div>
            </div>

            {/* Toast Notification */}
            {toastMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-950 text-emerald-100 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 border border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
                <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">No. Referensi</th>
                    <th className="p-3.5">Tipe Transaksi</th>
                    <th className="p-3.5">Rincian / Catatan</th>
                    <th className="p-3.5">Dicatat Oleh</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                        Tidak ada transaksi yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((trx) => {
                    const typeLabel = {
                      purchase: 'Pembelian',
                      prepare: 'Prepare',
                      production: 'Produksi / Penjualan',
                      adjustment: 'Penyesuaian',
                    }[trx.type];

                    const badgeClass = {
                      purchase: 'bg-emerald-100 text-emerald-800',
                      prepare: 'bg-blue-100 text-blue-800',
                      production: 'bg-amber-100 text-amber-800',
                      adjustment: 'bg-purple-100 text-purple-800',
                    }[trx.type];

                    let detailText = trx.notes || '-';
                    if (trx.type === 'purchase') {
                      const supplier = suppliers.find((s) => s.id === trx.supplier_id);
                      const movs = stockMovements.filter((m) => m.transaction_id === trx.id);
                      const supplierName = supplier ? supplier.name : 'Supplier';
                      detailText = `Pembelian dari ${supplierName} (${movs.length > 0 ? `${movs.length} jenis bahan` : 'Bahan Baku'})${trx.notes ? ` - ${trx.notes}` : ''}`;
                    } else if (trx.type === 'prepare') {
                      const movs = stockMovements.filter((m) => m.transaction_id === trx.id);
                      const targetMov = movs.find((m) => m.type === 'in');
                      const targetIng = ingredients.find((i) => i.id === targetMov?.ingredient_id || i.code === targetMov?.ingredient_id);
                      const sourceCount = movs.filter((m) => m.type === 'out').length;
                      const targetName = targetIng ? targetIng.name : 'Bahan PP';
                      detailText = `Prepare ${targetName} (+${formatNumber(targetMov?.quantity || 0)}) dari ${sourceCount} bahan mentah${trx.notes ? ` - ${trx.notes}` : ''}`;
                    } else if (trx.type === 'production') {
                      const menu = menus.find((m) => m.id === trx.menu_id);
                      detailText = `Produksi ${trx.portion_count || 1} porsi ${menu ? menu.name : 'Menu'}${trx.notes ? ` (${trx.notes})` : ''}`;
                    } else if (trx.type === 'adjustment') {
                      const movs = stockMovements.filter((m) => m.transaction_id === trx.id);
                      const adjIng = ingredients.find((i) => i.id === movs[0]?.ingredient_id || i.code === movs[0]?.ingredient_id);
                      const ingName = adjIng ? adjIng.name : 'Bahan';
                      const moveType = movs[0]?.type === 'in' ? '+' : '-';
                      detailText = `Penyesuaian ${ingName} (${moveType}${formatNumber(movs[0]?.quantity || 0)}) [${trx.adjustment_reason || 'Opname'}]${trx.notes ? ` - ${trx.notes}` : ''}`;
                    }

                    return (
                      <tr key={trx.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 text-stone-600 font-medium whitespace-nowrap">{formatDate(trx.transaction_date, true)}</td>
                        <td className="p-3.5 font-mono font-bold text-stone-800">{trx.reference_no}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${badgeClass}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-700 font-medium">{detailText}</td>
                        <td className="p-3.5 text-stone-600 font-medium whitespace-nowrap">{trx.created_by}</td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTrxForDetail(trx)}
                              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1 border border-stone-200"
                              title="Lihat Rincian Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-600" />
                              <span>Rincian</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTrxForDelete(trx)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 border border-rose-200"
                              title="Hapus Transaksi & Kembalikan Stok"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL TRANSAKSI MODAL */}
      {selectedTrxForDetail && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                  {selectedTrxForDetail.reference_no}
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm font-serif">Rincian Transaksi Inventaris</h3>
                  <p className="text-[11px] text-stone-500">
                    Detail pergerakan stok bahan & informasi transaksi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrxForDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Meta Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] block uppercase font-bold">Tipe Transaksi</span>
                  <span className="font-bold text-stone-900 capitalize">
                    {{
                      purchase: '🛒 Pembelian',
                      prepare: '🍳 Prepare (Konversi)',
                      production: '🍲 Produksi Menu',
                      adjustment: '⚖️ Penyesuaian Stok',
                    }[selectedTrxForDetail.type]}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block uppercase font-bold">Tanggal & Waktu</span>
                  <span className="font-bold text-stone-900">
                    {formatDate(selectedTrxForDetail.transaction_date, true)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block uppercase font-bold">Dicatat Oleh</span>
                  <span className="font-bold text-stone-900">{selectedTrxForDetail.created_by}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block uppercase font-bold">Catatan</span>
                  <span className="font-semibold text-stone-700">{selectedTrxForDetail.notes || '-'}</span>
                </div>
              </div>

              {/* Contextual Info */}
              {selectedTrxForDetail.type === 'purchase' && selectedTrxForDetail.supplier_id && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-bold">Supplier / Pemasok:</span>
                  <span className="font-mono font-extrabold">
                    {suppliers.find((s) => s.id === selectedTrxForDetail.supplier_id)?.name || 'Supplier'}
                  </span>
                </div>
              )}

              {selectedTrxForDetail.type === 'production' && selectedTrxForDetail.menu_id && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-bold">Menu Diproduksi:</span>
                  <span className="font-extrabold">
                    {menus.find((m) => m.id === selectedTrxForDetail.menu_id)?.name || 'Menu'} ({selectedTrxForDetail.portion_count || 1} Porsi)
                  </span>
                </div>
              )}

              {selectedTrxForDetail.type === 'adjustment' && selectedTrxForDetail.adjustment_reason && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                  <span className="font-bold">Alasan Penyesuaian:</span>
                  <span className="font-extrabold">{selectedTrxForDetail.adjustment_reason}</span>
                </div>
              )}

              {/* Stock Movements Table */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-stone-600" /> Rincian Pergerakan Stok Bahan
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">Bahan</th>
                        <th className="p-2.5 text-center">Pergerakan</th>
                        <th className="p-2.5 text-right">Jumlah</th>
                        <th className="p-2.5 text-right">Sisa Stok Setelahnya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {stockMovements
                        .filter((m) => m.transaction_id === selectedTrxForDetail.id)
                        .map((mov) => {
                          const ing = ingredients.find((i) => i.id === mov.ingredient_id || i.code === mov.ingredient_id);
                          const unit = units.find((u) => u.id === ing?.unit_id);
                          const isIn = mov.type === 'in';

                          return (
                            <tr key={mov.id} className="hover:bg-stone-50">
                              <td className="p-2.5">
                                <span className="font-bold text-stone-900 block">{ing?.name || mov.ingredient_id}</span>
                                <span className="font-mono text-[10px] text-stone-400">[{ing?.code || 'RAW'}]</span>
                              </td>
                              <td className="p-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isIn ? '+ Masuk' : '- Keluar'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-stone-800">
                                {isIn ? '+' : '-'}{formatNumber(mov.quantity)} {unit?.abbreviation || ''}
                              </td>
                              <td className="p-2.5 text-right font-mono font-extrabold text-stone-900">
                                {formatNumber(mov.balance_after)} {unit?.abbreviation || ''}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const trx = selectedTrxForDetail;
                  setSelectedTrxForDetail(null);
                  setSelectedTrxForDelete(trx);
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200"
              >
                <Trash2 className="w-4 h-4" /> Hapus Transaksi Ini
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrxForDetail(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {selectedTrxForDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif">
                  Hapus Transaksi & Revert Stok?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  No. Ref: <span className="font-mono font-bold text-stone-800">{selectedTrxForDelete.reference_no}</span> ({formatDate(selectedTrxForDelete.transaction_date)})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-rose-700" /> PERINGATAN REVERT STOK:
              </p>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Menghapus transaksi ini akan secara otomatis <strong>MENGEMBALIKAN (rollback) stok seluruh bahan</strong> yang terpengaruh ke posisi sebelum transaksi dibuat.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-800 mb-2">Daftar Perubahan Stok Yang Akan Di-revert:</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {stockMovements
                  .filter((m) => m.transaction_id === selectedTrxForDelete.id)
                  .map((mov) => {
                    const ing = ingredients.find((i) => i.id === mov.ingredient_id || i.code === mov.ingredient_id);
                    const unit = units.find((u) => u.id === ing?.unit_id);
                    const revertType = mov.type === 'in' ? 'Berkurang (-)' : 'Bertambah (+)';
                    const revertColor = mov.type === 'in' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

                    return (
                      <div key={mov.id} className="p-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900 block">{ing?.name || mov.ingredient_id}</span>
                          <span className="text-[10px] text-stone-500 font-mono">Stok Sekarang: {formatNumber(ing?.current_stock || 0)} {unit?.abbreviation || ''}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg border font-mono font-extrabold text-[11px] ${revertColor}`}>
                          {revertType} {formatNumber(mov.quantity)} {unit?.abbreviation || ''}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedTrxForDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const refNo = selectedTrxForDelete.reference_no;
                  deleteTransaction(selectedTrxForDelete.id);
                  setSelectedTrxForDelete(null);
                  setToastMsg(`Transaksi ${refNo} berhasil dihapus dan posisi stok bahan telah dikembalikan ke kondisi semula.`);
                  setTimeout(() => setToastMsg(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus & Revert Stok</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* KOSONGKAN RIWAYAT CONFIRM MODAL */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif">Kosongkan Seluruh Riwayat Transaksi?</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Seluruh data riwayat pergerakan stok, pembelian, prepare, produksi, dan penyesuaian akan dihapus bersih dari sistem dan Supabase.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium mb-5">
              ⚠️ Tindakan ini tidak dapat dibatalkan. Pastikan Anda telah menyimpan laporan atau data pendukung yang diperlukan.
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllTransactions();
                  setShowClearAllModal(false);
                  setToastMsg('Seluruh riwayat transaksi berhasil dikosongkan.');
                  setTimeout(() => setToastMsg(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
