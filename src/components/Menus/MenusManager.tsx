import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  X,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Menu } from '../../types';
import { formatNumber } from '../../utils/formatters';

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
    } else {
      setEditingMenu(null);
      setMenuName('');
      setMenuCategory('Snack');
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;

    if (editingMenu) {
      updateMenu(editingMenu.id, {
        name: menuName,
        category: menuCategory,
        price: editingMenu.price || 0,
      });
    } else {
      addMenu({
        name: menuName,
        category: menuCategory,
        price: 0,
        is_active: true,
      });
    }
    setIsMenuModalOpen(false);
  };

  // Open Recipe BOM Editor
  const handleOpenRecipeEditor = (menu: Menu) => {
    setSelectedMenuForRecipe(menu);
    const { recipe, details } = getMenuRecipeDetails(menu.id);

    setRecipeNotes(recipe?.notes || `Formula resep ${menu.name}`);
    if (details.length > 0) {
      setRecipeItems(
        details.map((d) => ({
          ingredient_id: d.ingredient_id,
          quantity: String(d.quantity),
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
    setRecipeItems([
      ...recipeItems,
      { ingredient_id: ingredients[0]?.id || '', quantity: '10' },
    ]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSaveRecipeVersion = () => {
    if (!selectedMenuForRecipe) return;
    const validDetails = recipeItems
      .filter((item) => item.ingredient_id && Number(item.quantity) > 0)
      .map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: Number(item.quantity),
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
      {/* Top Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="font-bold text-stone-900 text-base font-serif">Master Menu & Formula Resep (BOM)</h3>
          <p className="text-xs text-stone-500">Kelola daftar menu jualan dan komposisi takaran bahan per porsi</p>
        </div>
        <button
          onClick={() => handleOpenMenuModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> + Tambah Menu Baru
        </button>
      </div>

      {/* Menus List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => {
          const { recipe, details } = getMenuRecipeDetails(menu.id);
          const menuVersions = recipes.filter((r) => r.menu_id === menu.id);

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
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenMenuModal(menu)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-stone-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus menu "${menu.name}"?`)) deleteMenu(menu.id);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
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
                <input
                  type="text"
                  placeholder="Contoh: Snack / Main Course / Beverage"
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
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
                        <select
                          value={item.ingredient_id}
                          onChange={(e) => {
                            const newItems = [...recipeItems];
                            newItems[idx].ingredient_id = e.target.value;
                            setRecipeItems(newItems);
                          }}
                          className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-stone-200 focus:outline-none"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              [{i.type === 'raw' ? 'Mentah' : 'Prepare PP'}] {i.name}
                            </option>
                          ))}
                        </select>

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
