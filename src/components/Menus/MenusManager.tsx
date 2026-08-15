import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  X,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Menu } from '../../types';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { SearchableIngredientSelect } from '../Common/SearchableIngredientSelect';

export const MenusManager: React.FC = () => {
  const {
    menus,
    ingredients,
    units,
    recipes,
    recipeDetails,
    addMenu,
    updateMenu,
    deleteMenu,
    addRecipeVersion,
    setActiveRecipeVersion,
    getMenuRecipeDetails,
  } = useInventory();

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('');
  const [menuPrice, setMenuPrice] = useState('0');

  // Filter & Sort State for Menu List
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category'>('name_asc');

  // Recipe BOM Editor Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedMenuForRecipe, setSelectedMenuForRecipe] = useState<Menu | null>(null);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredient_id: string; quantity: string }>>([]);

  // Open Menu Create / Edit
  const handleOpenMenuModal = (menu?: Menu) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuName(menu.name);
      setMenuCategory(menu.category);
      setMenuPrice(String(menu.price || 0));
    } else {
      setEditingMenu(null);
      setMenuName('');
      setMenuCategory('Kitchen');
      setMenuPrice('0');
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;

    const numPrice = Math.max(0, Number(menuPrice) || 0);

    if (editingMenu) {
      updateMenu(editingMenu.id, {
        name: menuName,
        category: menuCategory,
        price: numPrice,
      });
    } else {
      addMenu({
        name: menuName,
        category: menuCategory,
        price: numPrice,
        is_active: true,
      });
    }
    setIsMenuModalOpen(false);
  };

  // Extract unique categories dynamically from menus
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    menus.forEach((m) => {
      if (m.category && m.category.trim()) {
        cats.add(m.category.trim());
      }
    });
    // Ensure Kitchen and Bar are included
    cats.add('Kitchen');
    cats.add('Bar');

    const getCatPriority = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower.includes('kitchen') || lower.includes('dapur')) return 1;
      if (lower.includes('bar') || lower.includes('minuman')) return 2;
      return 3;
    };

    return Array.from(cats).sort((a, b) => {
      const pA = getCatPriority(a);
      const pB = getCatPriority(b);
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b);
    });
  }, [menus]);

  // Filtered and Sorted Menus List
  const filteredAndSortedMenus = useMemo(() => {
    return menus
      .filter((m) => {
        const matchSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch) return false;

        if (categoryFilter !== 'all') {
          const catLower = m.category.toLowerCase();
          if (categoryFilter.toLowerCase() === 'kitchen') {
            return (
              catLower.includes('kitchen') ||
              catLower.includes('dapur') ||
              catLower.includes('food') ||
              catLower.includes('snack') ||
              catLower.includes('main')
            );
          }
          if (categoryFilter.toLowerCase() === 'bar') {
            return (
              catLower.includes('bar') ||
              catLower.includes('beverage') ||
              catLower.includes('minuman') ||
              catLower.includes('drink') ||
              catLower.includes('kopi') ||
              catLower.includes('coffee')
            );
          }
          return catLower === categoryFilter.toLowerCase();
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true });
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'id', { sensitivity: 'base', numeric: true });
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'category') {
          const catComp = a.category.localeCompare(b.category, 'id', { sensitivity: 'base' });
          if (catComp !== 0) return catComp;
          return a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true });
        }
        return 0;
      });
  }, [menus, searchQuery, categoryFilter, sortBy]);

  // Open Recipe BOM Editor
  const handleOpenRecipeEditor = (menu: Menu) => {
    setSelectedMenuForRecipe(menu);
    const { recipe, details } = getMenuRecipeDetails(menu.id);

    setRecipeNotes(recipe?.notes || `Formula resep ${menu.name}`);
    if (details.length > 0) {
      const uniqueDetailsMap = new Map<string, string>();
      for (const d of details) {
        if (d.ingredient_id) {
          uniqueDetailsMap.set(d.ingredient_id, String(d.quantity));
        }
      }
      setRecipeItems(
        Array.from(uniqueDetailsMap.entries()).map(([ingId, qty]) => ({
          ingredient_id: ingId,
          quantity: qty,
        }))
      );
    } else {
      // Default initial row
      setRecipeItems([
        {
          ingredient_id: ingredients[0]?.id || '',
          quantity: '100',
        },
      ]);
    }

    setIsRecipeModalOpen(true);
  };

  const handleAddRecipeRow = () => {
    const existingIngIds = new Set(recipeItems.map((i) => i.ingredient_id));
    const nextAvailableIng = ingredients.find((i) => !existingIngIds.has(i.id)) || ingredients[0];
    setRecipeItems([
      ...recipeItems,
      { ingredient_id: nextAvailableIng?.id || '', quantity: '10' },
    ]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSaveRecipeVersion = () => {
    if (!selectedMenuForRecipe) return;

    const ingredientMap = new Map<string, number>();
    for (const item of recipeItems) {
      if (item.ingredient_id && Number(item.quantity) > 0) {
        ingredientMap.set(item.ingredient_id, Number(item.quantity));
      }
    }

    const validDetails = Array.from(ingredientMap.entries()).map(([ingId, qty]) => ({
      ingredient_id: ingId,
      quantity: qty,
    }));

    if (validDetails.length === 0) {
      alert('Resep harus memiliki minimal 1 bahan baku valid!');
      return;
    }

    addRecipeVersion(selectedMenuForRecipe.id, recipeNotes, validDetails);
    setIsRecipeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="font-bold text-stone-900 text-base font-serif">Master Menu & Formula Resep (BOM)</h3>
          <p className="text-xs text-stone-500">Kelola daftar menu jualan, harga, dan komposisi takaran bahan per porsi</p>
        </div>
        <button
          onClick={() => handleOpenMenuModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> + Tambah Menu Baru
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-48">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama menu / kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-amber-500 font-semibold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-200/60"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg shrink-0 transition-all ${
                categoryFilter === 'all'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua
            </button>
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-bold rounded-lg shrink-0 transition-all ${
                  categoryFilter === cat
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-semibold text-stone-600">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-bold text-stone-800 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none cursor-pointer"
          >
            <option value="name_asc">Nama (A - Z)</option>
            <option value="name_desc">Nama (Z - A)</option>
            <option value="price_asc">Harga (Termurah)</option>
            <option value="price_desc">Harga (Termahal)</option>
            <option value="category">Kategori (Kitchen / Bar)</option>
          </select>
        </div>
      </div>

      {/* Menus List Grid */}
      {filteredAndSortedMenus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 italic">
          Tidak ada menu yang sesuai dengan pencarian atau filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMenus.map((menu) => {
            const { recipe, details } = getMenuRecipeDetails(menu.id);

            return (
              <div
                key={menu.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        {menu.category}
                      </span>
                      <h4 className="font-bold text-stone-900 text-lg font-serif mt-1.5">{menu.name}</h4>
                      <p className="text-xs font-extrabold text-amber-900 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        {formatCurrency(menu.price || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenMenuModal(menu)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-stone-100"
                        title="Edit Menu"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Hapus menu "${menu.name}"?`)) {
                            await deleteMenu(menu.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Recipe Summary */}
                  <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                      <span className="flex items-center gap-1.5 text-stone-900">
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        Komposisi Resep
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {details.length} Bahan
                      </span>
                    </div>

                    {details.length === 0 ? (
                      <p className="text-xs text-rose-600 font-medium italic">
                        Resep belum dikonfigurasi!
                      </p>
                    ) : (
                      <ul className="space-y-1 text-[11px] text-stone-600">
                        {details.slice(0, 4).map((d) => (
                          <li key={d.id} className="flex items-center justify-between">
                            <span>{d.ingredient?.name || 'Bahan'}</span>
                            <span className="font-mono font-bold text-stone-800">
                              {formatNumber(d.quantity)} {d.unit?.abbreviation}
                            </span>
                          </li>
                        ))}
                        {details.length > 4 && (
                          <li className="text-[10px] text-amber-700 font-bold">
                            + {details.length - 4} bahan lainnya...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Editor Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRecipeEditor(menu)}
                    className="flex-1 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                    Edit Resep
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MENU MODAL */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base font-serif">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pisang Goreng Saus Caramel"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori Menu</label>
                <select
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bar">Bar</option>
                  <option value="Snack">Snack</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Beverage">Beverage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="Contoh: 25000"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-amber-900 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs shadow-md"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPE BOM MODAL */}
      {isRecipeModalOpen && selectedMenuForRecipe && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base font-serif">
                  Formula Resep (BOM): {selectedMenuForRecipe.name}
                </h3>
                <p className="text-xs text-stone-500">
                  Atur komposisi dan takaran bahan baku per porsi untuk menu ini.
                </p>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Formula Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan / Keterangan Resep</label>
                <input
                  type="text"
                  placeholder="Contoh: Formula standar porsi regular"
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              {/* Recipe Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">
                    Daftar Komposisi Bahan (Per 1 Porsi)
                  </label>
                  <button
                    onClick={handleAddRecipeRow}
                    className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Bahan
                  </button>
                </div>

                <div className="space-y-2">
                  {recipeItems.map((item, idx) => {
                    const ing = ingredients.find((i) => i.id === item.ingredient_id);
                    const unit = units.find((u) => u.id === ing?.unit_id);

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200"
                      >
                        <SearchableIngredientSelect
                          ingredients={ingredients}
                          value={item.ingredient_id}
                          onChange={(newId) => {
                            const newItems = [...recipeItems];
                            newItems[idx].ingredient_id = newId;
                            setRecipeItems(newItems);
                          }}
                          className="flex-1"
                        />

                        <div className="w-32 flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...recipeItems];
                              newItems[idx].quantity = e.target.value;
                              setRecipeItems(newItems);
                            }}
                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-white border border-stone-200 focus:outline-none"
                          />
                          <span className="text-xs font-bold text-stone-500 min-w-8">
                            {unit?.abbreviation || '-'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveRecipeRow(idx)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRecipeVersion}
                className="px-5 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs shadow-md"
              >
                Simpan Resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
