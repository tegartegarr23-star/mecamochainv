import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Package, Tag } from 'lucide-react';
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
  placeholder = 'Ketik nama / kode bahan...',
  className = '',
  showStock = true,
  showCode = true,
  disabled = false,
  filterType = 'all',
}) => {
  const { categories, units } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIngredient = useMemo(() => {
    return ingredients.find((i) => i.id === value);
  }, [ingredients, value]);

  // Sync input text with selected ingredient when closed
  useEffect(() => {
    if (!isOpen) {
      setInputText(selectedIngredient ? selectedIngredient.name : '');
    }
  }, [selectedIngredient, isOpen]);

  // Available categories based on ingredients in scope
  const availableCategories = useMemo(() => {
    const usedCatIds = new Set<string>();
    ingredients.forEach((ing) => {
      if (ing.category_id) {
        usedCatIds.add(ing.category_id);
      }
    });

    const list = categories.filter((c) => usedCatIds.has(c.id));
    return list.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [ingredients, categories]);

  // Filter and sort ingredients strictly
  const filteredIngredients = useMemo(() => {
    const q = inputText.trim().toLowerCase();

    return ingredients
      .filter((ing) => {
        // Filter by type (raw vs prepared)
        if (filterType !== 'all' && ing.type !== filterType) {
          return false;
        }

        // Search query filter (matches name or code or category name)
        if (q && isOpen) {
          const matchName = ing.name.toLowerCase().includes(q);
          const matchCode = (ing.code || '').toLowerCase().includes(q);
          const cat = categories.find((c) => c.id === ing.category_id);
          const matchCat = cat ? cat.name.toLowerCase().includes(q) : false;

          if (!matchName && !matchCode && !matchCat) return false;
        }

        // Category pill filter
        if (catFilter !== 'all' && ing.category_id !== catFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort strictly Alphabetical A-Z by Ingredient Name
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true });
      });
  }, [ingredients, inputText, isOpen, catFilter, filterType, categories]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredIngredients]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputText(selectedIngredient ? selectedIngredient.name : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIngredient]);

  const handleSelect = (ing: Ingredient) => {
    onChange(ing.id);
    setInputText(ing.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredIngredients.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredIngredients.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredIngredients[highlightedIndex]) {
        handleSelect(filteredIngredients[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputText(selectedIngredient ? selectedIngredient.name : '');
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-highlighted="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Combobox Input Box */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all bg-white ${
          disabled
            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-stone-300 hover:border-stone-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-2xs'
        }`}
      >
        <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />

        {/* Selected Code Badge */}
        {showCode && selectedIngredient && !isOpen && (
          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px] font-extrabold shrink-0 border border-stone-200">
            {selectedIngredient.code}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              if (selectedIngredient && inputText === selectedIngredient.name) {
                inputRef.current?.select();
              }
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none truncate"
        />

        {/* Selected Stock pill */}
        {showStock && selectedIngredient && !isOpen && (
          <span className="text-[10px] text-stone-500 font-mono font-bold shrink-0 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200">
            {formatNumber(selectedIngredient.current_stock)}{' '}
            {units.find((u) => u.id === selectedIngredient.unit_id)?.abbreviation || ''}
          </span>
        )}

        {/* Clear Button */}
        {inputText && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputText('');
              onChange('');
              inputRef.current?.focus();
              setIsOpen(true);
            }}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 shrink-0"
            title="Hapus pencarian"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Dropdown Toggle Arrow */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!isOpen) {
              inputRef.current?.focus();
            }
            setIsOpen(!isOpen);
          }}
          className="p-1 text-stone-400 hover:text-stone-700 rounded-md shrink-0"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </button>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-stone-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-[320px] sm:w-[420px] md:w-[480px] max-w-[95vw]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header Info & Category Pills */}
          <div className="p-3 border-b border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between text-xs px-1 text-stone-600 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-stone-700">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Filter Kategori Bahan:
              </span>
              <span className="text-[11px] font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                {filteredIngredients.length} bahan (A - Z)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCatFilter('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  catFilter === 'all'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                }`}
              >
                Semua ({ingredients.length})
              </button>
              {availableCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setCatFilter(c.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    catFilter === c.id
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-stone-100 p-1.5">
            {filteredIngredients.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
                <Package className="w-6 h-6 text-stone-300" />
                <p className="font-semibold text-stone-600">Bahan "{inputText}" tidak ditemukan</p>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setInputText('');
                    setCatFilter('all');
                  }}
                  className="px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100"
                >
                  Tampilkan Semua Bahan
                </button>
              </div>
            ) : (
              filteredIngredients.map((ing, idx) => {
                const isSelected = ing.id === value;
                const isHighlighted = idx === highlightedIndex;
                const cat = categories.find((c) => c.id === ing.category_id);
                const unit = units.find((u) => u.id === ing.unit_id);

                return (
                  <button
                    key={ing.id}
                    type="button"
                    data-highlighted={isHighlighted ? 'true' : 'false'}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(ing);
                    }}
                    onClick={() => handleSelect(ing)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-100 text-blue-950 font-bold border border-blue-300 shadow-2xs'
                        : isHighlighted
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {showCode && (
                        <span className="px-2 py-1 rounded bg-stone-100 text-stone-700 font-mono text-[10px] font-extrabold shrink-0 border border-stone-200">
                          {ing.code}
                        </span>
                      )}

                      <span className="font-bold text-stone-900 text-sm leading-snug whitespace-normal break-words">
                        {ing.name}
                      </span>

                      {cat && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 shrink-0 border border-stone-200">
                          {cat.name}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border ${
                          ing.type === 'prepared'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {ing.type === 'prepared' ? 'PP PREP' : 'MENTAH'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {showStock && (
                        <span className="text-xs font-mono font-bold text-stone-700 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200">
                          {formatNumber(ing.current_stock)} {unit?.abbreviation || ''}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-700 shrink-0" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer keyboard hint */}
          <div className="p-2 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 text-center flex items-center justify-center gap-2">
            <span>Tekan <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-300 text-stone-700 font-bold">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-300 text-stone-700 font-bold">↓</kbd> geser</span>
            <span>&bull;</span>
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-300 text-stone-700 font-bold">Enter</kbd> atau <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-300 text-stone-700 font-bold">Klik</kbd> pilih</span>
          </div>
        </div>
      )}
    </div>
  );
};
