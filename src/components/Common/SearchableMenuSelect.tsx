import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Utensils, Tag } from 'lucide-react';
import { Menu } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SearchableMenuSelectProps {
  menus: Menu[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableMenuSelect: React.FC<SearchableMenuSelectProps> = ({
  menus,
  value,
  onChange,
  placeholder = 'Ketik nama menu di sini...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedMenu = useMemo(() => {
    return menus.find((m) => m.id === value);
  }, [menus, value]);

  // Sync input text with selected menu when not actively typing/opened
  useEffect(() => {
    if (!isOpen) {
      setInputText(selectedMenu ? selectedMenu.name : '');
    }
  }, [selectedMenu, isOpen]);

  // Extract unique categories dynamically from menus
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    menus.forEach((m) => {
      if (m.category && m.category.trim()) {
        cats.add(m.category.trim());
      }
    });
    // Ensure Kitchen & Bar exist
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
      return a.localeCompare(b, 'id', { sensitivity: 'base' });
    });
  }, [menus]);

  // Filter and sort menus
  const filteredMenus = useMemo(() => {
    const q = inputText.trim().toLowerCase();

    return menus
      .filter((m) => {
        // Search query filter (matches name or category)
        if (q && isOpen) {
          const matchName = m.name.toLowerCase().includes(q);
          const matchCat = m.category.toLowerCase().includes(q);
          if (!matchName && !matchCat) return false;
        }

        // Category filter
        if (catFilter !== 'all') {
          const cLower = m.category.toLowerCase();
          if (catFilter.toLowerCase() === 'kitchen') {
            return (
              cLower.includes('kitchen') ||
              cLower.includes('dapur') ||
              cLower.includes('food') ||
              cLower.includes('snack') ||
              cLower.includes('main')
            );
          }
          if (catFilter.toLowerCase() === 'bar') {
            return (
              cLower.includes('bar') ||
              cLower.includes('beverage') ||
              cLower.includes('minuman') ||
              cLower.includes('drink') ||
              cLower.includes('kopi') ||
              cLower.includes('coffee')
            );
          }
          return cLower === catFilter.toLowerCase();
        }

        return true;
      })
      .sort((a, b) => {
        // Sort strictly Alphabetical A-Z by Menu Name
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true });
      });
  }, [menus, inputText, isOpen, catFilter]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredMenus]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputText(selectedMenu ? selectedMenu.name : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMenu]);

  const handleSelect = (menu: Menu) => {
    onChange(menu.id);
    setInputText(menu.name);
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
      setHighlightedIndex((prev) => (prev < filteredMenus.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredMenus.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMenus[highlightedIndex]) {
        handleSelect(filteredMenus[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputText(selectedMenu ? selectedMenu.name : '');
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Direct Input Field */}
      <div
        className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl border transition-all bg-white ${
          disabled
            ? 'bg-stone-100 border-stone-200 cursor-not-allowed opacity-60'
            : isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
            : 'border-stone-300 hover:border-amber-400 shadow-2xs'
        }`}
      >
        <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            // Select text on focus for quick overwrite
            inputRef.current?.select();
          }}
          onChange={(e) => {
            setInputText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:outline-none"
        />

        {/* Selected Category & Price Tag if already chosen */}
        {selectedMenu && !isOpen && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-sans text-[10px] font-extrabold border border-amber-200">
              {selectedMenu.category}
            </span>
            {selectedMenu.price > 0 && (
              <span className="text-[10px] text-amber-800 font-extrabold font-mono">
                {formatCurrency(selectedMenu.price)}
              </span>
            )}
          </div>
        )}

        {/* Clear Button */}
        {inputText && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputText('');
              onChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 shrink-0"
            title="Hapus / Reset"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Dropdown Toggle Chevron */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="p-1 text-stone-400 hover:text-stone-700 shrink-0"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-700' : ''}`}
          />
        </button>
      </div>

      {/* Floating Suggestions List with wide and clear dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[320px] sm:min-w-[380px] md:min-w-[440px] max-w-[92vw]"
          style={{ width: 'max-content' }}
        >
          {/* Quick Category Filter Pills */}
          <div className="p-2.5 border-b border-stone-100 bg-stone-50/95 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] px-1 text-stone-500 font-semibold">
              <span className="flex items-center gap-1 text-stone-600">
                <Utensils className="w-3.5 h-3.5 text-amber-700" /> Kategori Menu:
              </span>
              <span className="text-[10px] font-bold text-stone-400">
                {filteredMenus.length} menu (A - Z)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setCatFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all ${
                  catFilter === 'all'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                Semua ({menus.length})
              </button>
              {dynamicCategories.map((cat) => {
                const count = menus.filter((m) => m.category?.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all ${
                      catFilter === cat
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                    }`}
                  >
                    {cat} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List Options (Alphabetical A-Z, wide & clear) */}
          <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 p-1.5">
            {filteredMenus.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 font-medium italic">
                Menu "{inputText}" tidak ditemukan
              </div>
            ) : (
              filteredMenus.map((m, idx) => {
                const isSelected = m.id === value;
                const isHighlighted = idx === highlightedIndex;
                const isKitchen =
                  m.category.toLowerCase().includes('kitchen') || m.category.toLowerCase().includes('dapur');
                const isBar =
                  m.category.toLowerCase().includes('bar') || m.category.toLowerCase().includes('minuman');

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                        : isHighlighted
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border uppercase tracking-wider ${
                          isKitchen
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isBar
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {m.category || 'Menu'}
                      </span>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {m.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {m.price > 0 && (
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {formatCurrency(m.price)}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
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
