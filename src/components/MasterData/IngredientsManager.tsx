import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Tag,
  Building,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Ingredient, IngredientType } from '../../types';
import { formatNumber, formatCurrency } from '../../utils/formatters';

export const IngredientsManager: React.FC = () => {
  const {
    ingredients,
    units,
    categories,
    suppliers,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addUnit,
    addCategory,
    addSupplier,
  } = useInventory();

  // Active subtab in Master Data
  const [subTab, setSubTab] = useState<'ingredients' | 'units' | 'categories' | 'suppliers'>('ingredients');

  // Search & Filters for Ingredients
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Ingredient Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    unit_id: '',
    type: 'raw' as IngredientType,
    min_stock: '0',
    initial_stock: '0',
    cost_per_unit: '0',
    is_active: true,
  });

  // Master Data Add Quick States
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAbbr, setNewUnitAbbr] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Open Create/Edit Ingredient Modal
  const handleOpenModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIngredient(ing);
      setFormData({
        code: ing.code,
        name: ing.name,
        category_id: ing.category_id,
        unit_id: ing.unit_id,
        type: ing.type,
        min_stock: String(ing.min_stock),
        initial_stock: String(ing.current_stock),
        cost_per_unit: String(ing.cost_per_unit || 0),
        is_active: ing.is_active,
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        code: `ING-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        category_id: categories[0]?.id || '',
        unit_id: units[0]?.id || '',
        type: 'raw',
        min_stock: '100',
        initial_stock: '0',
        cost_per_unit: '0',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        code: formData.code,
        name: formData.name,
        category_id: formData.category_id,
        unit_id: formData.unit_id,
        type: formData.type,
        min_stock: Number(formData.min_stock),
        current_stock: Number(formData.initial_stock),
        cost_per_unit: Number(formData.cost_per_unit),
        is_active: formData.is_active,
      });
    } else {
      addIngredient({
        code: formData.code,
        name: formData.name,
        category_id: formData.category_id,
        unit_id: formData.unit_id,
        type: formData.type,
        min_stock: Number(formData.min_stock),
        initial_stock: Number(formData.initial_stock),
        cost_per_unit: Number(formData.cost_per_unit),
        is_active: formData.is_active,
      });
    }

    setIsModalOpen(false);
  };

  // Filter Ingredients Logic
  const filteredIngredients = ingredients.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    let matchesStatus = true;
    if (stockStatusFilter === 'critical') {
      matchesStatus = item.current_stock <= item.min_stock;
    } else if (stockStatusFilter === 'safe') {
      matchesStatus = item.current_stock > item.min_stock;
    }

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Master Data Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('ingredients')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            subTab === 'ingredients'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Master Bahan Baku ({ingredients.length})
        </button>
        <button
          onClick={() => setSubTab('units')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            subTab === 'units'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Satuan ({units.length})
        </button>
        <button
          onClick={() => setSubTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            subTab === 'categories'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Kategori ({categories.length})
        </button>
        <button
          onClick={() => setSubTab('suppliers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            subTab === 'suppliers'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Supplier ({suppliers.length})
        </button>
      </div>

      {/* SUBTAB 1: INGREDIENTS */}
      {subTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau kode bahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Tipe (Mentah & PP)</option>
                <option value="raw">Raw (Mentah)</option>
                <option value="prepared">Prepared (PP / Setengah Jadi)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
              >
                <option value="all">Semua Status Stok</option>
                <option value="critical">Stok Kritis (Min Stock)</option>
                <option value="safe">Stok Aman</option>
              </select>

              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> + Tambah Bahan
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Kode</th>
                    <th className="p-3.5">Nama Bahan</th>
                    <th className="p-3.5">Tipe</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Satuan</th>
                    <th className="p-3.5 text-right">Stok Min</th>
                    <th className="p-3.5 text-right">Stok Saat Ini</th>
                    <th className="p-3.5 text-right">Biaya/Unit</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-stone-500">
                        Tidak ada data bahan baku ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const unit = units.find((u) => u.id === ing.unit_id);
                      const cat = categories.find((c) => c.id === ing.category_id);
                      const isLowStock = ing.current_stock <= ing.min_stock;

                      return (
                        <tr key={ing.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-3.5 font-mono font-semibold text-stone-700">{ing.code}</td>
                          <td className="p-3.5 font-bold text-stone-900">{ing.name}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                ing.type === 'raw'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-purple-100 text-purple-900 border border-purple-200'
                              }`}
                            >
                              {ing.type === 'raw' ? 'Mentah (Raw)' : 'Prepare (PP)'}
                            </span>
                          </td>
                          <td className="p-3.5 text-stone-600 font-medium">{cat?.name || '-'}</td>
                          <td className="p-3.5 text-stone-600 font-medium">
                            {unit?.name} ({unit?.abbreviation})
                          </td>
                          <td className="p-3.5 text-right text-stone-500 font-mono">
                            {formatNumber(ing.min_stock)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold">
                            <span
                              className={`px-2 py-1 rounded-lg ${
                                isLowStock
                                  ? 'bg-rose-100 text-rose-700 font-extrabold'
                                  : 'text-stone-900'
                              }`}
                            >
                              {formatNumber(ing.current_stock)} {unit?.abbreviation}
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-stone-600 font-mono">
                            {formatCurrency(ing.cost_per_unit || 0)}
                          </td>
                          <td className="p-3.5 text-center">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> Stok Kritis
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenModal(ing)}
                                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-amber-800"
                                title="Edit Bahan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus bahan baku "${ing.name}"?`)) {
                                    deleteIngredient(ing.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-600"
                                title="Hapus Bahan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: UNITS */}
      {subTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-stone-900 text-sm font-serif">Tambah Satuan Baru</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Nama Satuan</label>
                <input
                  type="text"
                  placeholder="Contoh: Milliliter"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Singkatan / Simbol</label>
                <input
                  type="text"
                  placeholder="Contoh: ml"
                  value={newUnitAbbr}
                  onChange={(e) => setNewUnitAbbr(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (newUnitName && newUnitAbbr) {
                    addUnit({ name: newUnitName, abbreviation: newUnitAbbr });
                    setNewUnitName('');
                    setNewUnitAbbr('');
                  }
                }}
                className="w-full py-2 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900"
              >
                + Simpan Satuan
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Nama Satuan</th>
                  <th className="p-3.5">Singkatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold text-stone-900">{u.name}</td>
                    <td className="p-3.5 font-mono text-stone-600">{u.abbreviation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CATEGORIES */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-stone-900 text-sm font-serif">Tambah Kategori Baru</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Bumbu & Saus"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (newCategoryName) {
                    addCategory({ name: newCategoryName });
                    setNewCategoryName('');
                  }
                }}
                className="w-full py-2 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900"
              >
                + Simpan Kategori
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Nama Kategori</th>
                  <th className="p-3.5 text-right">Jumlah Bahan Baku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.map((c) => {
                  const count = ingredients.filter((i) => i.category_id === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="p-3.5 font-bold text-stone-900">{c.name}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-800">{count} item</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SUPPLIERS */}
      {subTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-stone-900 text-sm font-serif">Tambah Supplier Baru</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Nama Pemasok</label>
                <input
                  type="text"
                  placeholder="Contoh: PT Boga Utama"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Kontak / No. WA</label>
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Alamat</label>
                <textarea
                  placeholder="Alamat kantor / gudang supplier..."
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  rows={2}
                />
              </div>
              <button
                onClick={() => {
                  if (newSupplierName) {
                    addSupplier({
                      name: newSupplierName,
                      contact: newSupplierContact,
                      address: newSupplierAddress,
                    });
                    setNewSupplierName('');
                    setNewSupplierContact('');
                    setNewSupplierAddress('');
                  }
                }}
                className="w-full py-2 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900"
              >
                + Simpan Supplier
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Nama Supplier</th>
                  <th className="p-3.5">Kontak</th>
                  <th className="p-3.5">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold text-stone-900">{s.name}</td>
                    <td className="p-3.5 text-stone-600 font-mono">{s.contact || '-'}</td>
                    <td className="p-3.5 text-stone-600">{s.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT INGREDIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base font-serif">
                {editingIngredient ? 'Edit Master Bahan' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kode Bahan</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tipe Bahan</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as IngredientType })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  >
                    <option value="raw">Mentah (Raw Material)</option>
                    <option value="prepared">Prepared (Half-Finished / PP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dada Ayam Mentah / Ayam Marinasi PP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Satuan</label>
                  <select
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Batas Stok Min</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  />
                </div>
                {!editingIngredient && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Stok Awal</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.initial_stock}
                      onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Estimasi Biaya / Unit (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md"
                >
                  {editingIngredient ? 'Update Bahan' : 'Simpan Bahan Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
