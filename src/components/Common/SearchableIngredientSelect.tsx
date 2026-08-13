import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Package } from 'lucide-react';
import { Ingredient } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';

interface SearchableIngredientSelectProps {
  ingredients: Ingredient[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  showStock?: boolean;
  showCode?: boolean;
  disabled?: boolean;
  filterType?: 'all' | 'raw' | 'prepared';
}

export const SearchableIngredientSelect: React.FC<SearchableIngredientSelectProps> = ({
  ingredients,
  value,
  onChange,
  placeholder = 'Ketik/Cari bahan baku...',
  className = '',
  showStock = true,
  showCode = true,
  disabled = false,
  filterType = 'all',
}) => {
  const { categories } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter ingredients by filterType first
  const filteredByType = ingredients.filter((ing) => {
    if (filterType === 'all') return true;
    return ing.type === filterType;
  });

  // Filter by user search query
  const matchingIngredients = filteredByType.filter((ing) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = ing.name.toLowerCase().includes(q);
    const matchCode = ing.code.toLowerCase().includes(q);
    return matchName || matchCode;
  });

  // Sort alphabetically per category then name
  const sortedIngredients = [...matchingIngredients].sort((a, b) => {
    const catA = categories.find((c) => c.id === a.category_id)?.name || '';
    const catB = categories.find((c) => c.id === b.category_id)?.name || '';
    const catCompare = catA.localeCompare(catB, 'id', { sensitivity: 'base' });
    if (catCompare !== 0) return catCompare;
    return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
  });

  const selectedIngredient = ingredients.find((ing) => ing.id === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative min-w-[200px] ${className}`}>
      {/* Selected Box / Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition-all text-left ${
          disabled
            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white text-stone-900 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-stone-50/80 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {selectedIngredient ? (
            <>
              {showCode && (
                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px] font-extrabold shrink-0 border border-stone-200">
                  {selectedIngredient.code}
                </span>
              )}
              <span className="truncate font-bold text-stone-900">{selectedIngredient.name}</span>
              {showStock && (
                <span className="text-[10px] text-stone-500 font-normal shrink-0">
                  ({formatNumber(selectedIngredient.current_stock)})
                </span>
              )}
            </>
          ) : (
            <span className="text-stone-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar Input */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama atau kode (cth: MM001 / Air)..."
              className="w-full bg-transparent text-xs font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:outline-none py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/60"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List Items */}
          <div className="max-h-60 overflow-y-auto divide-y divide-stone-50 p-1">
            {sortedIngredients.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-1">
                <Package className="w-6 h-6 text-stone-300" />
                <span>Bahan "{searchQuery}" tidak ditemukan</span>
              </div>
            ) : (
              sortedIngredients.map((ing) => {
                const isSelected = ing.id === value;
                const catName = categories.find((c) => c.id === ing.category_id)?.name;

                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleSelect(ing.id)}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-50/90 text-amber-950 font-bold border border-amber-200/80'
                        : 'hover:bg-stone-100/80 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-mono text-[10px] font-extrabold shrink-0 border border-stone-200/60">
                        {ing.code}
                      </span>
                      <span className="truncate font-semibold">{ing.name}</span>
                      {catName && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-stone-100 text-stone-600 shrink-0 border border-stone-200/40">
                          {catName}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          ing.type === 'prepared'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {ing.type === 'prepared' ? 'Prepare' : 'Mentah'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {showStock && (
                        <span className="text-[10px] font-mono font-bold text-stone-500">
                          {formatNumber(ing.current_stock)}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
