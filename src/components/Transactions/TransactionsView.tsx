import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import {
  TransactionType,
  PurchaseItemInput,
  PrepareItemInput,
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
  } = useInventory();

  // Active Tab: History vs New Transaction Forms
  const [activeTab, setActiveTab] = useState<'purchase' | 'prepare' | 'production' | 'adjustment' | 'history'>(
    initialAction || 'production'
  );

  useEffect(() => {
    if (initialAction) {
      setActiveTab(initialAction);
    }
  }, [initialAction]);

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
  const [prepDate, setPrepDate] = useState(new Date().toISOString().slice(0, 10));
  const [prepRefNo, setPrepRefNo] = useState(generateRefNo('PREP'));
  const [prepNotes, setPrepNotes] = useState('');
  const [prepItems, setPrepItems] = useState<PrepareItemInput[]>([
    { ingredient_id: ingredients.find((i) => i.type === 'raw')?.id || '', quantity: 2000, is_target: false },
    { ingredient_id: ingredients.find((i) => i.type === 'prepared')?.id || '', quantity: 2200, is_target: true },
  ]);

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
  const [adjIngredientId, setAdjIngredientId] = useState(ingredients[0]?.id || '');
  const [adjQty, setAdjQty] = useState(100);
  const [adjMode, setAdjMode] = useState<'plus' | 'minus'>('minus');
  const [adjReason, setAdjReason] = useState<'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other'>('Damage');
  const [adjNotes, setAdjNotes] = useState('');

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
    addAdjustmentTransaction(adjDate, adjIngredientId, adjQty, adjMode, adjReason, adjNotes);
    alert('Penyesuaian stok berhasil disimpan!');
    setAdjNotes('');
    setActiveTab('history');
  };

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
            <Plus className="w-4 h-4 text-amber-400" /> Produksi Menu
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal Produksi</label>
                <input
                  type="date"
                  required
                  value={prodDate}
                  onChange={(e) => setProdDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

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
                disabled={!productionSufficiency.isSufficient}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                  productionSufficiency.isSufficient
                    ? 'bg-amber-800 hover:bg-amber-900'
                    : 'bg-stone-300 cursor-not-allowed'
                }`}
              >
                {productionSufficiency.isSufficient
                  ? 'Proses & Potong Stok Otomatis'
                  : 'Stok Kurang (Tidak Dapat Disimpan)'}
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" /> Stok Tidak Cukup!
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
                Mengubah bahan mentah (Stok berkurang) menjadi bahan setengah jadi/PP (Stok bertambah)
              </p>
            </div>
          </div>

          <form onSubmit={handlePrepareSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={prepDate}
                  onChange={(e) => setPrepDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
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

            {/* Prepare Items Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">Komposisi Bahan Konversi (Masuk & Keluar)</h4>
                <button
                  type="button"
                  onClick={() =>
                    setPrepItems([
                      ...prepItems,
                      {
                        ingredient_id: ingredients[0]?.id || '',
                        quantity: 100,
                        is_target: false,
                      },
                    ])
                  }
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Baris Bahan
                </button>
              </div>

              <div className="space-y-2">
                {prepItems.map((item, idx) => {
                  const ing = ingredients.find((i) => i.id === item.ingredient_id);
                  const unit = units.find((u) => u.id === ing?.unit_id);

                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      <select
                        value={item.is_target ? 'target' : 'source'}
                        onChange={(e) => {
                          const newItems = [...prepItems];
                          newItems[idx].is_target = e.target.value === 'target';
                          setPrepItems(newItems);
                        }}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg border ${
                          item.is_target
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        <option value="source">Keluar (-) Bahan Mentah</option>
                        <option value="target">Masuk (+) Hasil Prepare (PP)</option>
                      </select>

                      <select
                        value={item.ingredient_id}
                        onChange={(e) => {
                          const newItems = [...prepItems];
                          newItems[idx].ingredient_id = e.target.value;
                          setPrepItems(newItems);
                        }}
                        className="flex-1 min-w-48 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-stone-200 focus:outline-none"
                      >
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            [{i.type === 'raw' ? 'Mentah' : 'Prepare PP'}] {i.name} (Stok: {formatNumber(i.current_stock)})
                          </option>
                        ))}
                      </select>

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
              className="w-full py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md"
            >
              Simpan Transaksi Prepare
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal Pembelian</label>
                <input
                  type="date"
                  required
                  value={purDate}
                  onChange={(e) => setPurDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
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
                        <select
                          value={item.ingredient_id}
                          onChange={(e) => {
                            const newIngId = e.target.value;
                            const selectedIng = ingredients.find((i) => i.id === newIngId);
                            const newItems = [...purItems];
                            newItems[idx].ingredient_id = newIngId;
                            if (selectedIng?.cost_per_unit) {
                              newItems[idx].unit_price = selectedIng.cost_per_unit;
                            }
                            setPurItems(newItems);
                          }}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.code})
                            </option>
                          ))}
                        </select>
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tipe Penyesuaian</label>
                <select
                  value={adjMode}
                  onChange={(e) => setAdjMode(e.target.value as 'plus' | 'minus')}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="minus">Keluar (-) Penurunan Stok</option>
                  <option value="plus">Masuk (+) Penambahan Stok</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pilih Bahan Baku</label>
              <select
                value={adjIngredientId}
                onChange={(e) => setAdjIngredientId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
              >
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Stok: {formatNumber(i.current_stock)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kuantitas Penyesuaian</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Alasan Penyesuaian</label>
                <select
                  value={adjReason}
                  onChange={(e) =>
                    setAdjReason(e.target.value as 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other')
                  }
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="Damage">Damage (Kerusakan)</option>
                  <option value="Expired">Expired (Kadaluwarsa)</option>
                  <option value="Loss">Loss (Kehilangan)</option>
                  <option value="Stock Opname">Stock Opname (Selisih)</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
            </div>

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
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm font-serif">Riwayat Semua Transaksi Inventaris</h3>
            <span className="text-xs text-stone-500 font-medium">Total: {transactions.length} transaksi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">No. Referensi</th>
                  <th className="p-3.5">Tipe Transaksi</th>
                  <th className="p-3.5">Catatan / Detail</th>
                  <th className="p-3.5">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((trx) => {
                  const typeLabel = {
                    purchase: 'Pembelian',
                    prepare: 'Prepare',
                    production: 'Produksi Menu',
                    adjustment: 'Penyesuaian',
                  }[trx.type];

                  const badgeClass = {
                    purchase: 'bg-emerald-100 text-emerald-800',
                    prepare: 'bg-blue-100 text-blue-800',
                    production: 'bg-amber-100 text-amber-800',
                    adjustment: 'bg-purple-100 text-purple-800',
                  }[trx.type];

                  return (
                    <tr key={trx.id} className="hover:bg-stone-50">
                      <td className="p-3.5 text-stone-600">{formatDate(trx.transaction_date, true)}</td>
                      <td className="p-3.5 font-mono font-bold text-stone-800">{trx.reference_no}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-700">{trx.notes || '-'}</td>
                      <td className="p-3.5 text-stone-600 font-medium">{trx.created_by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
