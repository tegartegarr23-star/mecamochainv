import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Menu } from '../../types';

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
  placeholder = 'Ketik & cari nama menu...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedMenu = useMemo(() => {
    return menus.find((m) => m.id === value || m.name.toLowerCase() === value.toLowerCase());
  }, [menus, value]);

  // Filter and sort menus purely by name
  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return menus
      .filter((m) => {
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true });
      });
  }, [menus, searchQuery]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredMenus]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (menu: Menu) => {
    onChange(menu.id);
    setSearchQuery('');
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
      setSearchQuery('');
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* If a menu is selected and dropdown is closed, show clear prominent Menu Name Box */}
      {selectedMenu && !isOpen ? (
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchQuery('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs rounded-xl border transition-all cursor-pointer bg-white ${
            disabled
              ? 'bg-stone-100 border-stone-200 cursor-not-allowed opacity-60'
              : 'border-amber-300 hover:border-amber-500 hover:bg-amber-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-bold text-stone-900 text-sm truncate block">
              {selectedMenu.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setSearchQuery('');
                  setIsOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Ganti / Hapus Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <ChevronDown className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      ) : (
        /* Active Search / Select Input Box */
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs rounded-xl border transition-all bg-white cursor-text ${
            disabled
              ? 'bg-stone-100 border-stone-200 cursor-not-allowed opacity-60'
              : isOpen
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-stone-300 hover:border-amber-400 shadow-2xs'
          }`}
        >
          <Search className="w-4 h-4 text-stone-400 shrink-0" />

          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={searchQuery}
            placeholder={selectedMenu ? selectedMenu.name : placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:outline-none text-sm"
          />

          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 shrink-0"
              title="Reset Pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
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
      )}

      {/* Floating Suggestions List - Clean Menu Names only */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-stone-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-full min-w-[280px] max-w-[95vw]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* List Options (Alphabetical A-Z, Clean Name display) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 p-1.5">
            {filteredMenus.length === 0 ? (
              <div className="p-5 text-center text-xs text-stone-500 font-medium italic space-y-2">
                <p>Menu "{searchQuery}" tidak ditemukan</p>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-200 cursor-pointer"
                >
                  Tampilkan Semua Menu
                </button>
              </div>
            ) : (
              filteredMenus.map((m, idx) => {
                const isSelected = m.id === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(m);
                    }}
                    onClick={() => handleSelect(m)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                        : isHighlighted
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span className="font-bold text-stone-900 text-sm leading-snug truncate flex-1">
                      {m.name}
                    </span>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count & shortcut hint */}
          <div className="p-2 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 text-center flex items-center justify-between px-3">
            <span>{filteredMenus.length} menu tersedia</span>
            <span>Tekan <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-300 text-stone-700 font-bold">Enter</kbd> pilih</span>
          </div>
        </div>
      )}
    </div>
  );
};
