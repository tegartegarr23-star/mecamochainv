import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  AppUser,
  Unit,
  Category,
  Supplier,
  Ingredient,
  Menu,
  Recipe,
  RecipeDetail,
  Transaction,
  TransactionType,
  StockMovement,
  PurchaseItemInput,
  PrepareItemInput,
  ProductionItemInput,
  AdjustmentItemInput,
  DailyStockRow,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_UNITS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_INGREDIENTS,
  INITIAL_MENUS,
  INITIAL_RECIPES,
  INITIAL_RECIPE_DETAILS,
  INITIAL_TRANSACTIONS,
  INITIAL_STOCK_MOVEMENTS,
} from '../data/seedData';
import { BEVERAGE_INGREDIENTS } from '../data/beverageSeed';
import { generateRefNo, createLocalDateTimeIso } from '../utils/formatters';
import { getSupabase } from '../lib/supabase';

export const STANDARD_CATEGORIES: Category[] = [
  { id: 'cat-kitchen', name: 'Kitchen' },
  { id: 'cat-bar', name: 'Bar' },
];

export const normalizeIngredientCategory = (ing: Partial<Ingredient>): string => {
  if (!ing) return 'cat-kitchen';
  const code = String(ing.code || '').trim().toUpperCase();
  const id = String(ing.id || '').trim().toLowerCase();

  // Rule 1: Code starts with MM (e.g. MM001 to MM110) or id starts with ing-mm -> Kitchen
  if (code.startsWith('MM') || id.startsWith('ing-mm')) {
    return 'cat-kitchen';
  }
  // Rule 2: Code starts with PP and digits (e.g. PP001 to PP022, not PPB) -> Kitchen
  if (/^PP\d+/i.test(code) || /^ing-pp\d+/i.test(id)) {
    return 'cat-kitchen';
  }
  // Rule 3: Code starts with PPB (PP Bar) -> Bar
  if (code.startsWith('PPB') || id.startsWith('ing-ppb')) {
    return 'cat-bar';
  }
  // Rule 4: Beverage codes -> Bar
  const beverageCodes = new Set([
    'HOU', 'KRI', 'FRM', 'CUI', 'CUL', 'ACP', 'GRE', 'SKG', 'GAC', 'SHI', 'SES', 'MIB', 'MAT',
    'TOC', 'MAV', 'TOB', 'WHS', 'GAF', 'DRC', 'TEP', 'TEG', 'TED', 'TEJ', 'SCT', 'ARV', 'AST',
    'SAN', 'CRC', 'BTL', 'MOC', 'MAL', 'TOP', 'FAN', 'MAN', 'MAS', 'MAM', 'PUM', 'TOS', 'BUL',
    'CRM', 'STW', 'MAL01', 'DIB', 'TOC01', 'TET', 'GUA', 'EGW', 'PPB01', 'PPB02', 'PPB03',
    'PPB04', 'PPB05', 'PPB06', 'PPB07', 'PPB08', 'PPB09'
  ]);
  if (beverageCodes.has(code) || BEVERAGE_INGREDIENTS.some((b) => b.id === id || b.code.toUpperCase() === code)) {
    return 'cat-bar';
  }

  // Preserve if explicitly cat-kitchen or cat-bar
  if (ing.category_id === 'cat-kitchen' || ing.category_id === 'cat-bar') {
    return ing.category_id;
  }

  return 'cat-kitchen';
};

export const getYYYYMMDD = (input: string | Date | undefined | null): string => {
  if (!input) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === 'all') return 'all';
    // Check regex YYYY-MM-DD directly FIRST to avoid UTC/local offset shift
    const matchIso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchIso) {
      const y = matchIso[1];
      const m = matchIso[2].padStart(2, '0');
      const d = matchIso[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const matchId = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchId) {
      const d = matchId[1].padStart(2, '0');
      const m = matchId[2].padStart(2, '0');
      const y = matchId[3];
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  if (input instanceof Date && !isNaN(input.getTime())) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export interface ParsedProductionSoldItem {
  menu_id: string;
  name: string;
  portion_count: number;
}

export const parseSoldItemsFromNotes = (
  notes: string | undefined | null,
  availableMenus: Menu[] = []
): ParsedProductionSoldItem[] => {
  if (!notes || typeof notes !== 'string') return [];
  const cleanNotes = notes.trim();
  if (!cleanNotes) return [];

  // Extract inner text if wrapped in (Terjual ...) or starts with Terjual / Penjualan
  let text = cleanNotes;
  const innerMatch = cleanNotes.match(/\((?:Terjual|Penjualan)\s*:?\s*([^)]+)\)/i);
  if (innerMatch && innerMatch[1]) {
    text = innerMatch[1];
  } else {
    const segmentMatch = cleanNotes.match(/(?:Terjual|Penjualan)\s*:?\s*([^()]+)/i);
    if (segmentMatch && segmentMatch[1]) {
      text = segmentMatch[1];
    }
  }

  // Remove leading bullets or dashes
  text = text.replace(/^[•\-\*\s]+/, '').trim();

  // Split by comma, semicolon, newline, or bullet
  const parts = text.split(/[,;\n•]+/).map((s) => s.trim()).filter(Boolean);
  const itemsMap = new Map<string, { menu_id: string; name: string; portion_count: number }>();

  const allMenus = [...availableMenus, ...INITIAL_MENUS];

  for (const rawPart of parts) {
    let part = rawPart.replace(/^(?:Terjual|Penjualan)\s*:?\s*/i, '').trim();
    if (!part) continue;

    let count = 1;
    let menuName = '';

    // Regex 1: "6 porsi Snack Platter" or "6x Snack Platter" or "6 Snack Platter"
    const m1 = part.match(/^([\d.]+)\s*(?:porsi|x|portion|portions)?\s+(.+)$/i);
    // Regex 2: "Snack Platter: 6 porsi" or "Snack Platter: 6" or "Snack Platter - 6"
    const m2 = part.match(/^(.+?)\s*[:\-]\s*([\d.]+)\s*(?:porsi|x)?$/i);
    // Regex 3: "Snack Platter (6 porsi)" or "Snack Platter (6)"
    const m3 = part.match(/^(.+?)\s*\(\s*([\d.]+)\s*(?:porsi|x)?\s*\)$/i);

    if (m1) {
      count = parseFloat(m1[1]) || 1;
      menuName = m1[2].trim();
    } else if (m2) {
      menuName = m2[1].trim();
      count = parseFloat(m2[2]) || 1;
    } else if (m3) {
      menuName = m3[1].trim();
      count = parseFloat(m3[2]) || 1;
    } else {
      const matched = allMenus.find((m) => part.toLowerCase().includes(m.name.toLowerCase()));
      if (matched) {
        menuName = matched.name;
        const numMatch = part.match(/([\d.]+)/);
        count = numMatch ? parseFloat(numMatch[1]) : 1;
      }
    }

    if (!menuName) continue;
    menuName = menuName.replace(/^[(\[]+/, '').replace(/[)\]]+$/, '').trim();

    const cleanNameLower = menuName.toLowerCase();
    let foundMenu = allMenus.find((m) => m.name.trim().toLowerCase() === cleanNameLower);
    if (!foundMenu) {
      foundMenu = allMenus.find((m) => m.name.toLowerCase().includes(cleanNameLower) || cleanNameLower.includes(m.name.toLowerCase()));
    }

    const menuId = foundMenu ? foundMenu.id : `menu-${menuName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const displayName = foundMenu ? foundMenu.name : menuName;

    const existing = itemsMap.get(menuId);
    if (existing) {
      existing.portion_count += count;
    } else {
      itemsMap.set(menuId, {
        menu_id: menuId,
        name: displayName,
        portion_count: count,
      });
    }
  }

  return Array.from(itemsMap.values());
};

export const reconcileHistoricalTransactionsAndMovements = (
  rawTransactions: Transaction[],
  rawMovements: StockMovement[],
  rawIngredients: Ingredient[],
  rawRecipeDetails: RecipeDetail[],
  rawRecipes: Recipe[],
  rawMenus: Menu[],
  rawPrepareFormulas: Record<string, Array<{ ingredient_id: string; quantity: number }>> = {}
) => {
  let repairedCount = 0;
  let runningMovements = [...rawMovements];

  // Helper to find recipe details for a menu
  const getDetailsForMenu = (menuId: string, menuName?: string): RecipeDetail[] => {
    const possibleRecipeIds = new Set<string>([
      `rec-${menuId}`,
      `rec-${menuId.replace('-', '')}`,
      menuId,
    ]);
    rawRecipes.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));
    INITIAL_RECIPES.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));

    let details = rawRecipeDetails.filter((rd) => rd && rd.recipe_id && possibleRecipeIds.has(rd.recipe_id));
    if (details.length === 0) {
      details = INITIAL_RECIPE_DETAILS.filter((rd) => rd && rd.recipe_id && possibleRecipeIds.has(rd.recipe_id));
    }

    if (details.length === 0 && menuName) {
      const foundMenu = rawMenus.find((m) => m.name.toLowerCase() === menuName.toLowerCase()) ||
                        INITIAL_MENUS.find((m) => m.name.toLowerCase() === menuName.toLowerCase());
      if (foundMenu && foundMenu.id !== menuId) {
        return getDetailsForMenu(foundMenu.id);
      }
    }
    return details;
  };

  const updatedTransactions = rawTransactions.map((trx) => {
    const isMatchingMov = (m: StockMovement) => {
      if (!m) return false;
      if (m.transaction_id && String(m.transaction_id).trim() === String(trx.id).trim()) return true;
      if (trx.reference_no && m.description && m.description.includes(trx.reference_no)) return true;
      return false;
    };

    let trxMovs = runningMovements.filter(isMatchingMov);

    if (trx.type === 'production') {
      // 1. Determine sold items
      let soldItems: ParsedProductionSoldItem[] = [];

      const notesSold = parseSoldItemsFromNotes(trx.notes, rawMenus);
      if (notesSold.length > 1) {
        soldItems = notesSold;
      } else if (trx.production_items && Array.isArray(trx.production_items) && trx.production_items.length > 0) {
        soldItems = trx.production_items.map((pi) => {
          const m = rawMenus.find((menu) => menu.id === pi.menu_id) || INITIAL_MENUS.find((menu) => menu.id === pi.menu_id);
          return {
            menu_id: pi.menu_id,
            name: m ? m.name : pi.menu_id,
            portion_count: Number(pi.portion_count) || 1,
          };
        });
      } else if (notesSold.length === 1) {
        soldItems = notesSold;
      } else if (trx.menu_id && Number(trx.portion_count) > 0) {
        const m = rawMenus.find((menu) => menu.id === trx.menu_id) || INITIAL_MENUS.find((menu) => menu.id === trx.menu_id);
        soldItems = [{
          menu_id: trx.menu_id,
          name: m ? m.name : 'Menu',
          portion_count: Number(trx.portion_count),
        }];
      }

      if (soldItems.length > 0) {
        const totalSoldPortions = soldItems.reduce((acc, s) => acc + s.portion_count, 0);

        trx = {
          ...trx,
          production_items: soldItems.map((s) => ({ menu_id: s.menu_id, portion_count: s.portion_count })),
          portion_count: totalSoldPortions,
        };

        // Check if existing movements only cover 1 menu while we have multiple menus
        const isSingleMenuMovementWhileMultiItems =
          soldItems.length > 1 &&
          trxMovs.length > 0 &&
          trxMovs.every((m) => {
            const firstMenu = soldItems[0].name.toLowerCase();
            return m.description && m.description.toLowerCase().includes(firstMenu);
          });

        if (trxMovs.length === 0 || isSingleMenuMovementWhileMultiItems) {
          // Remove outdated single-menu movements
          runningMovements = runningMovements.filter((m) => !isMatchingMov(m));

          // Generate accurate movements for EVERY menu in soldItems
          let movIdx = 0;
          soldItems.forEach((item) => {
            const details = getDetailsForMenu(item.menu_id, item.name);
            details.forEach((d) => {
              const qty = Number(d.quantity) * Number(item.portion_count);
              if (qty > 0) {
                const newMov: StockMovement = {
                  id: `mov-reconciled-${trx.id}-${movIdx++}`,
                  transaction_id: trx.id,
                  ingredient_id: d.ingredient_id,
                  type: 'out',
                  quantity: qty,
                  balance_after: 0,
                  description: `Penjualan ${item.portion_count} porsi ${item.name} (${trx.reference_no})`,
                  created_at: trx.transaction_date || trx.created_at || new Date().toISOString(),
                };
                runningMovements.push(newMov);
              }
            });
          });
          repairedCount++;
        }
      }
    } else if (trx.type === 'prepare') {
      // Reconstruct missing movements for prepare transactions
      if (trxMovs.length === 0) {
        let targetPrepIng: Ingredient | undefined;
        if (trx.notes) {
          targetPrepIng = rawIngredients.find(
            (i) => i.type === 'prepared' && trx.notes?.toLowerCase().includes(i.name.toLowerCase())
          );
        }
        if (!targetPrepIng) {
          targetPrepIng =
            rawIngredients.find((i) => i.type === 'prepared' && (i.id === 'ing-ppb-kopsu' || i.name.toLowerCase().includes('kopsu'))) ||
            rawIngredients.find((i) => i.type === 'prepared') ||
            INITIAL_INGREDIENTS.find((i) => i.type === 'prepared');
        }

        if (targetPrepIng) {
          const prepId = targetPrepIng.id;
          const prepName = targetPrepIng.name;
          let targetQty = 1000;
          const qtyMatch = trx.notes ? trx.notes.match(/([\d.]+)\s*(?:ml|g|gram|kg|l|liter|unit)?/i) : null;
          if (qtyMatch && parseFloat(qtyMatch[1]) > 0) {
            targetQty = parseFloat(qtyMatch[1]);
          }

          const inMov: StockMovement = {
            id: `mov-prep-in-${trx.id}`,
            transaction_id: trx.id,
            ingredient_id: prepId,
            type: 'in',
            quantity: targetQty,
            balance_after: 0,
            description: `Hasil Proses Prepare / Konversi ${prepName} (${trx.reference_no})`,
            created_at: trx.transaction_date || trx.created_at || new Date().toISOString(),
          };
          runningMovements.push(inMov);

          const formulaDetails = rawPrepareFormulas[prepId] || [];
          if (formulaDetails.length > 0) {
            formulaDetails.forEach((fd, fdIdx) => {
              const rawIng = rawIngredients.find((i) => i.id === fd.ingredient_id);
              const rawName = rawIng ? rawIng.name : 'Bahan Mentah';
              const outQty = Number(fd.quantity) * (targetQty / 1000);
              if (outQty > 0) {
                const outMov: StockMovement = {
                  id: `mov-prep-out-${trx.id}-${fdIdx}`,
                  transaction_id: trx.id,
                  ingredient_id: fd.ingredient_id,
                  type: 'out',
                  quantity: outQty,
                  balance_after: 0,
                  description: `Pemakaian Bahan Mentah (${rawName}) untuk Prepare ${prepName} (${trx.reference_no})`,
                  created_at: trx.transaction_date || trx.created_at || new Date().toISOString(),
                };
                runningMovements.push(outMov);
              }
            });
          } else {
            const fallbackDetails = INITIAL_RECIPE_DETAILS.filter(
              (rd) => rd.recipe_id.includes(prepId) || rd.recipe_id === `rec-prep-${prepId}`
            );
            fallbackDetails.forEach((fd, fdIdx) => {
              const rawIng =
                rawIngredients.find((i) => i.id === fd.ingredient_id) ||
                INITIAL_INGREDIENTS.find((i) => i.id === fd.ingredient_id);
              const rawName = rawIng ? rawIng.name : 'Bahan Mentah';
              const outQty = Number(fd.quantity) * (targetQty / 1000);
              if (outQty > 0) {
                const outMov: StockMovement = {
                  id: `mov-prep-out-${trx.id}-${fdIdx}`,
                  transaction_id: trx.id,
                  ingredient_id: fd.ingredient_id,
                  type: 'out',
                  quantity: outQty,
                  balance_after: 0,
                  description: `Pemakaian Bahan Mentah (${rawName}) untuk Prepare ${prepName} (${trx.reference_no})`,
                  created_at: trx.transaction_date || trx.created_at || new Date().toISOString(),
                };
                runningMovements.push(outMov);
              }
            });
          }
          repairedCount++;
        }
      }
    }

    return trx;
  });

  // Combine and sort all movements chronologically ascending
  const allMovements = [...runningMovements].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id).localeCompare(String(b.id));
  });

  // Calculate sequential running stock balances
  const runningStock = new Map<string, number>();
  const finalMovements = allMovements.map((mov) => {
    const ingKey = String(mov.ingredient_id).trim().toLowerCase();
    const current = runningStock.get(ingKey) || 0;
    const qty = Number(mov.quantity) || 0;
    const nextBal = mov.type === 'in' ? current + qty : current - qty;
    runningStock.set(ingKey, nextBal);
    return {
      ...mov,
      balance_after: nextBal,
    };
  });

  // Update ingredients with normalized categories and calculated stock
  const reconciledIngredients = rawIngredients.map((ing) => {
    const idKey = String(ing.id).trim().toLowerCase();
    const codeKey = String(ing.code || '').trim().toLowerCase();
    const computedStock = runningStock.has(idKey)
      ? runningStock.get(idKey)!
      : (codeKey && runningStock.has(codeKey) ? runningStock.get(codeKey)! : (Number(ing.current_stock) || 0));

    return {
      ...ing,
      category_id: normalizeIngredientCategory(ing),
      current_stock: computedStock,
    };
  });

  return {
    reconciledTransactions: updatedTransactions,
    reconciledMovements: finalMovements,
    reconciledIngredients,
    repairedCount,
  };
};

interface ProductionSufficiencyResult {
  isSufficient: boolean;
  items: Array<{
    ingredient: Ingredient;
    unit: Unit | undefined;
    requiredQty: number;
    currentStock: number;
    isShortage: boolean;
    missingQty: number;
  }>;
}

interface InventoryContextType {
  // Users & Auth
  users: AppUser[];
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  addUser: (user: Omit<AppUser, 'id' | 'created_at'>) => void;
  deleteUser: (id: string) => void;
  isSuperAdmin: boolean;

  // Master Data
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, unit: Omit<Unit, 'id'>) => void;
  deleteUnit: (id: string) => void;

  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, sup: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;

  ingredients: Ingredient[];
  addIngredient: (ing: Omit<Ingredient, 'id' | 'current_stock'> & { initial_stock?: number }) => void;
  bulkAddIngredients: (items: Array<Omit<Ingredient, 'id' | 'current_stock'> & { initial_stock?: number }>) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => Promise<void>;

  menus: Menu[];
  addMenu: (menu: Omit<Menu, 'id'>) => Promise<void>;
  updateMenu: (id: string, menu: Partial<Menu>) => Promise<void>;
  deleteMenu: (id: string) => Promise<void>;

  // Recipes
  recipes: Recipe[];
  recipeDetails: RecipeDetail[];
  addRecipeVersion: (menuId: string, notes: string, details: Array<{ ingredient_id: string; quantity: number }>) => void;
  setActiveRecipeVersion: (menuId: string, version: number) => void;
  getMenuRecipeDetails: (menuId: string, version?: number) => { recipe?: Recipe; details: Array<RecipeDetail & { ingredient?: Ingredient; unit?: Unit }> };
  getPrepareFormula: (prepIngredientId: string) => { recipe?: Recipe; details: Array<RecipeDetail & { ingredient?: Ingredient; unit?: Unit }> };
  savePrepareFormula: (prepIngredientId: string, details: Array<{ ingredient_id: string; quantity: number }>) => Promise<void>;

  // Transactions & Stock Movements
  transactions: Transaction[];
  stockMovements: StockMovement[];
  
  addPurchaseTransaction: (date: string, supplierId: string, refNo: string, notes: string, items: PurchaseItemInput[]) => void;
  addPrepareTransaction: (date: string, refNo: string, notes: string, items: PrepareItemInput[]) => void;
  
  checkProductionSufficiency: (menuId: string, portionCount: number) => ProductionSufficiencyResult;
  addProductionTransaction: (
    date: string,
    menuIdOrItems: string | ProductionItemInput[],
    portionCountOrRefNo?: number | string,
    refNoOrNotes?: string,
    notesOrEmpty?: string
  ) => { success: boolean; message: string };
  
  addAdjustmentTransaction: (
    date: string,
    ingredientIdOrItems: string | AdjustmentItemInput[],
    quantityOrReason?: number | 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    modeOrNotes?: 'plus' | 'minus' | 'set' | string,
    reasonOrEmpty?: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    notesOrEmpty?: string
  ) => void;
  deleteTransaction: (transactionId: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;

  // Sync & Supabase
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  supabaseError: string | null;
  pushAllToSupabase: () => Promise<boolean>;
  pullFromSupabase: () => Promise<void>;

  // Reports & Ledger
  getDailyStockReport: (dateFilter: string) => DailyStockRow[];
  getIngredientLedger: (ingredientId: string) => StockMovement[];

  // Reconciliation & Repair
  reconcileAllHistoricalData: () => Promise<{ success: boolean; repairedCount: number }>;

  // Utility
  resetToDefaultData: () => void;
  generateSupabaseSQL: () => string;
}

const STORAGE_KEYS = {
  USERS: 'mecamocha_users_v3',
  CURRENT_USER: 'mecamocha_current_user_v3',
  UNITS: 'mecamocha_units_v3',
  CATEGORIES: 'mecamocha_categories_v3',
  SUPPLIERS: 'mecamocha_suppliers_v3',
  INGREDIENTS: 'mecamocha_ingredients_v3',
  MENUS: 'mecamocha_menus_v3',
  RECIPES: 'mecamocha_recipes_v3',
  RECIPE_DETAILS: 'mecamocha_recipe_details_v3',
  PREPARE_FORMULAS: 'mecamocha_prepare_formulas_v3',
  TRANSACTIONS: 'mecamocha_transactions_v3',
  STOCK_MOVEMENTS: 'mecamocha_stock_movements_v3',
  DELETED_ING_IDS: 'mecamocha_deleted_ing_ids_v3',
  DELETED_MENU_IDS: 'mecamocha_deleted_menu_ids_v3',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const getSavedDeletedIngIds = (): Set<string> => {
  try {
    const saved = localStorage.getItem('mecamocha_deleted_ing_ids_v3');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

const getSavedDeletedMenuIds = (): Set<string> => {
  try {
    const saved = localStorage.getItem('mecamocha_deleted_menu_ids_v3');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local Storage Helper
  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      const parsed = JSON.parse(item);
      return parsed;
    } catch {
      return fallback;
    }
  };

  const saveToStorage = <T,>(key: string, data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Helper to deduplicate recipe details by (recipe_id, ingredient_id)
  const sanitizeRecipeDetails = (detailsList: RecipeDetail[]): RecipeDetail[] => {
    if (!Array.isArray(detailsList)) return [];
    const map = new Map<string, RecipeDetail>();
    for (const item of detailsList) {
      if (item && item.recipe_id && item.ingredient_id) {
        const key = `${item.recipe_id}_${item.ingredient_id}`;
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  };

  // State Declarations
  const [users, setUsers] = useState<AppUser[]>(() => loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<AppUser>(() => loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]));
  const [units, setUnits] = useState<Unit[]>(() => loadFromStorage(STORAGE_KEYS.UNITS, INITIAL_UNITS));
  const [categories, setCategories] = useState<Category[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.CATEGORIES, STANDARD_CATEGORIES);
    const valid = (loaded && loaded.length > 0 ? loaded : STANDARD_CATEGORIES).filter((c) => {
      const name = (c.name || '').toLowerCase();
      return name === 'kitchen' || name === 'bar' || c.id === 'cat-kitchen' || c.id === 'cat-bar';
    });
    return valid.length > 0 ? valid : STANDARD_CATEGORIES;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS);
    const deletedIds = getSavedDeletedIngIds();
    const active = (!deletedIds || deletedIds.size === 0) ? loaded : loaded.filter((ing) => {
      const idStr = String(ing.id).trim();
      const codeStr = String(ing.code || '').trim();
      return (
        !deletedIds.has(idStr) &&
        !deletedIds.has(idStr.toLowerCase()) &&
        (!codeStr || (!deletedIds.has(codeStr) && !deletedIds.has(codeStr.toLowerCase())))
      );
    });
    return active.map((ing) => ({
      ...ing,
      category_id: normalizeIngredientCategory(ing),
    }));
  });
  const [menus, setMenus] = useState<Menu[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.MENUS, INITIAL_MENUS);
    const deletedIds = getSavedDeletedMenuIds();
    if (!deletedIds || deletedIds.size === 0) return loaded;
    return loaded.filter((m) => {
      const idStr = String(m.id).trim().toLowerCase();
      return !deletedIds.has(idStr) && !deletedIds.has(String(m.id).trim());
    });
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadFromStorage(STORAGE_KEYS.RECIPES, INITIAL_RECIPES));
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>(() => sanitizeRecipeDetails(loadFromStorage(STORAGE_KEYS.RECIPE_DETAILS, INITIAL_RECIPE_DETAILS)));
  const [prepareFormulas, setPrepareFormulas] = useState<Record<string, Array<{ ingredient_id: string; quantity: number }>>>(() => loadFromStorage(STORAGE_KEYS.PREPARE_FORMULAS, {}));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadFromStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS));
  const deletedTrxIdsRef = useRef<Set<string>>(new Set());
  const deletedIngIdsRef = useRef<Set<string>>(getSavedDeletedIngIds());
  const deletedMenuIdsRef = useRef<Set<string>>(getSavedDeletedMenuIds());

  // Realtime Broadcast Channel Helper
  const broadcastSync = (actionName: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const channel = supabase.channel('mecamocha-realtime-channel');
      channel.send({
        type: 'broadcast',
        event: 'mecamocha_sync',
        payload: { action: actionName, timestamp: Date.now() },
      }).then();
    } catch {}
  };

  // Helper to merge local state and remote Supabase state without wiping un-synced items
  const mergeByField = <T,>(localList: T[], remoteList: T[], key: keyof T): T[] => {
    const map = new Map<any, T>();
    localList.forEach((item) => {
      if (item && item[key]) map.set(item[key], item);
    });
    remoteList.forEach((item) => {
      if (item && item[key]) {
        const localItem = map.get(item[key]);
        if (localItem) {
          const mergedItem = { ...localItem, ...item };
          // If remote field is empty or null, but local has non-empty field, keep local!
          if (!item['category_id' as keyof T] && localItem['category_id' as keyof T]) {
            mergedItem['category_id' as keyof T] = localItem['category_id' as keyof T];
          }
          if (!item['unit_id' as keyof T] && localItem['unit_id' as keyof T]) {
            mergedItem['unit_id' as keyof T] = localItem['unit_id' as keyof T];
          }
          if (!item['transaction_id' as keyof T] && localItem['transaction_id' as keyof T]) {
            mergedItem['transaction_id' as keyof T] = localItem['transaction_id' as keyof T];
          }
          map.set(item[key], mergedItem);
        } else {
          map.set(item[key], item);
        }
      }
    });
    return Array.from(map.values());
  };

  // Sync data updates to Supabase
  const syncDataToSupabase = async (
    changedIngredients?: Ingredient[],
    newTrx?: Transaction,
    newMovements?: StockMovement[],
    overrideAllTrxs?: Transaction[],
    overrideAllMovs?: StockMovement[]
  ) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      let syncErr: string | null = null;

      // Broadcast immediately that local change occurred
      broadcastSync('sync_start');

      // 1. Sync ingredients
      if (changedIngredients && changedIngredients.length > 0) {
        // Ensure all categories and units exist in Supabase first so Foreign Key never rejects
        if (categories && categories.length > 0) {
          const cleanCats = categories.map((c) => ({
            id: String(c.id),
            name: String(c.name || ''),
          }));
          try { await supabase.from('categories').upsert(cleanCats); } catch {}
        }
        if (units && units.length > 0) {
          const cleanUnits = units.map((u) => ({
            id: String(u.id),
            name: String(u.name || ''),
            abbreviation: String(u.abbreviation || ''),
          }));
          try { await supabase.from('units').upsert(cleanUnits); } catch {}
        }

        const cleanIngredients = changedIngredients.map((ing) => ({
          id: String(ing.id),
          code: String(ing.code || ''),
          name: String(ing.name || ''),
          category_id: ing.category_id ? String(ing.category_id) : null,
          unit_id: ing.unit_id ? String(ing.unit_id) : null,
          type: ing.type || 'raw',
          min_stock: Number(ing.min_stock) || 0,
          current_stock: Number(ing.current_stock) || 0,
          is_active: ing.is_active ?? true,
          cost_per_unit: Number(ing.cost_per_unit) || 0,
          cogs_per_unit: Number(ing.cost_per_unit) || 0,
        }));

        let { error: ingErr } = await supabase.from('ingredients').upsert(cleanIngredients);
        if (ingErr) {
          // Fallback without extra columns in case DB table lacks them
          const fallbackIngs = cleanIngredients.map(({ cost_per_unit, cogs_per_unit, ...rest }) => rest);
          const res = await supabase.from('ingredients').upsert(fallbackIngs);
          ingErr = res.error;
        }

        if (ingErr) {
          console.error('Supabase ingredients upsert error:', ingErr);
          syncErr = `Gagal sync bahan: ${ingErr.message}`;
        } else {
          for (const cleanIng of cleanIngredients) {
            await supabase
              .from('ingredients')
              .update({ current_stock: cleanIng.current_stock })
              .eq('id', cleanIng.id);
          }
        }
      }

      // 2. Sync transactions (include newTrx and all existing transactions)
      const allTrxs = overrideAllTrxs || (newTrx
        ? [newTrx, ...transactions.filter((t) => t.id !== newTrx.id)]
        : transactions);

      // Direct immediate upsert for newTrx if present to guarantee it gets saved to cloud first
      if (newTrx) {
        const validSupplier = newTrx.supplier_id && suppliers.some((s) => s.id === newTrx.supplier_id);
        const validMenu = newTrx.menu_id && menus.some((m) => m.id === newTrx.menu_id);
        const cleanSingleTrx = {
          id: String(newTrx.id),
          type: String(newTrx.type),
          transaction_date: newTrx.transaction_date || new Date().toISOString(),
          reference_no: String(newTrx.reference_no || ''),
          supplier_id: validSupplier ? String(newTrx.supplier_id) : null,
          menu_id: validMenu ? String(newTrx.menu_id) : null,
          portion_count: newTrx.portion_count !== undefined && newTrx.portion_count !== null ? Number(newTrx.portion_count) : null,
          notes: newTrx.notes || null,
          created_by: newTrx.created_by || null,
          adjustment_reason: newTrx.adjustment_reason || null,
          created_at: newTrx.created_at || new Date().toISOString(),
        };
        
        let { error: singleTrxErr } = await supabase.from('transactions').upsert([cleanSingleTrx]);
        if (singleTrxErr) {
          // If foreign key failed on supplier_id or menu_id, retry with nulls
          const relaxedSingleTrx = {
            ...cleanSingleTrx,
            supplier_id: null,
            menu_id: null,
          };
          const res = await supabase.from('transactions').upsert([relaxedSingleTrx]);
          if (res.error) {
            console.warn('Single transaction upsert error:', res.error);
          }
        }
      }

      if (allTrxs.length > 0) {
        const cleanTrxs = allTrxs.map((t) => {
          const validSupplier = t.supplier_id && suppliers.some((s) => s.id === t.supplier_id);
          const validMenu = t.menu_id && menus.some((m) => m.id === t.menu_id);
          return {
            id: String(t.id),
            type: String(t.type),
            transaction_date: t.transaction_date || new Date().toISOString(),
            reference_no: String(t.reference_no || ''),
            supplier_id: validSupplier ? String(t.supplier_id) : null,
            menu_id: validMenu ? String(t.menu_id) : null,
            portion_count: t.portion_count !== undefined && t.portion_count !== null ? Number(t.portion_count) : null,
            notes: t.notes || null,
            created_by: t.created_by || null,
            adjustment_reason: t.adjustment_reason || null,
            created_at: t.created_at || new Date().toISOString(),
          };
        });

        // Upsert in chunks of 50
        const chunkSize = 50;
        for (let i = 0; i < cleanTrxs.length; i += chunkSize) {
          const chunk = cleanTrxs.slice(i, i + chunkSize);
          let { error: trxErr } = await supabase.from('transactions').upsert(chunk);
          if (trxErr) {
            // Retry row by row with relaxed foreign keys
            for (const row of chunk) {
              const res = await supabase.from('transactions').upsert([row]);
              if (res.error) {
                await supabase.from('transactions').upsert([{ ...row, supplier_id: null, menu_id: null }]);
              }
            }
          }
        }
      }

      // 3. Sync stock movements (include newMovements and all existing movements)
      const allMovs = overrideAllMovs || (newMovements && newMovements.length > 0
        ? [...newMovements, ...stockMovements.filter((m) => !newMovements.some((nm) => nm.id === m.id))]
        : stockMovements);

      // Direct immediate upsert for newMovements if present
      if (newMovements && newMovements.length > 0) {
        const cleanSingleMovs = newMovements.map((m) => {
          const foundIng = ingredients.find(
            (i) =>
              i.id === m.ingredient_id ||
              String(i.code).toLowerCase() === String(m.ingredient_id).toLowerCase()
          );
          const ingId = foundIng ? String(foundIng.id) : String(m.ingredient_id);
          let targetTrxId = m.transaction_id;
          if (!targetTrxId && m.description && allTrxs.length > 0) {
            const match = allTrxs.find((t) => t.reference_no && m.description?.includes(t.reference_no));
            if (match) targetTrxId = match.id;
          }
          const validTrx = targetTrxId && allTrxs.some((t) => t.id === targetTrxId);

          return {
            id: String(m.id),
            transaction_id: validTrx ? String(targetTrxId) : null,
            ingredient_id: ingId,
            type: String(m.type),
            quantity: Number(m.quantity) || 0,
            balance_after: Number(m.balance_after ?? 0),
            description: m.description || null,
            created_at: m.created_at || new Date().toISOString(),
          };
        });

        let { error: singleMovErr } = await supabase.from('stock_movements').upsert(cleanSingleMovs);
        if (singleMovErr) {
          // Retry row by row with relaxed foreign key
          for (const row of cleanSingleMovs) {
            const res = await supabase.from('stock_movements').upsert([row]);
            if (res.error) {
              await supabase.from('stock_movements').upsert([{ ...row, transaction_id: null }]);
              try { await supabase.from('stock_moved').upsert([row]); } catch {}
            }
          }
        }
      }

      if (allMovs.length > 0) {
        const cleanMovements = allMovs.map((m) => {
          const foundIng = ingredients.find(
            (i) =>
              i.id === m.ingredient_id ||
              String(i.code).toLowerCase() === String(m.ingredient_id).toLowerCase()
          );
          const ingId = foundIng ? String(foundIng.id) : String(m.ingredient_id);
          let targetTrxId = m.transaction_id;
          if (!targetTrxId && m.description && allTrxs.length > 0) {
            const match = allTrxs.find((t) => t.reference_no && m.description?.includes(t.reference_no));
            if (match) targetTrxId = match.id;
          }
          const validTrx = targetTrxId && allTrxs.some((t) => t.id === targetTrxId);

          return {
            id: String(m.id),
            transaction_id: validTrx ? String(targetTrxId) : null,
            ingredient_id: ingId,
            type: String(m.type),
            quantity: Number(m.quantity) || 0,
            balance_after: Number(m.balance_after ?? 0),
            description: m.description || null,
            created_at: m.created_at || new Date().toISOString(),
          };
        });

        // Upsert movements in chunks of 50 to prevent timeout
        const chunkSize = 50;
        let movErr: any = null;
        for (let i = 0; i < cleanMovements.length; i += chunkSize) {
          const chunk = cleanMovements.slice(i, i + chunkSize);
          const { error } = await supabase.from('stock_movements').upsert(chunk);
          if (error) {
            movErr = error;
            for (const row of chunk) {
              try {
                const res = await supabase.from('stock_movements').upsert([row]);
                if (res.error) {
                  await supabase.from('stock_movements').upsert([{ ...row, transaction_id: null }]);
                }
              } catch {}
            }
          }
        }
        if (movErr) {
          console.warn('Supabase movements upsert chunk handled with fallback');
        }
      }

      if (syncErr) {
        setSupabaseError(syncErr);
      } else {
        setLastSyncedAt(new Date());
        setSupabaseError(null);
      }

      // Broadcast update completed
      broadcastSync('sync_completed');
    } catch (e: any) {
      console.warn('Supabase sync warning:', e);
      setSupabaseError(e?.message || 'Gagal tersambung ke Supabase');
    }
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Pull data from Supabase
  const pullFromSupabase = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const [
        { data: sbUnits },
        { data: sbCategories },
        { data: sbSuppliers },
        { data: sbIngredients, error: ingErr },
        { data: sbMenus },
        { data: sbRecipes },
        { data: sbRecipeDetails },
        { data: sbTransactions, error: trxErr },
        { data: sbStockMovements, error: movErr },
      ] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('ingredients').select('*').order('code', { ascending: true }),
        supabase.from('menus').select('*').order('name', { ascending: true }),
        supabase.from('recipes').select('*'),
        supabase.from('recipe_details').select('*'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(5000),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(5000),
      ]);

      if (ingErr || trxErr || movErr) {
        const errMsg = ingErr?.message || trxErr?.message || movErr?.message || 'Error fetching Supabase data';
        setSupabaseError(errMsg);
      } else {
        setSupabaseError(null);
      }

      let recipeDetailsData = sbRecipeDetails;
      if (!recipeDetailsData || recipeDetailsData.length === 0) {
        const { data: sbRecipeItems } = await supabase.from('recipe_items').select('*');
        if (sbRecipeItems && sbRecipeItems.length > 0) recipeDetailsData = sbRecipeItems;
      }

      let stockMovementsData = sbStockMovements;
      if (!stockMovementsData || stockMovementsData.length === 0) {
        const { data: sbStockMoved } = await supabase.from('stock_moved').select('*').order('created_at', { ascending: false });
        if (sbStockMoved && sbStockMoved.length > 0) stockMovementsData = sbStockMoved;
      }

      if (sbUnits && sbUnits.length > 0) {
        setUnits((prev) => {
          const merged = mergeByField(prev, sbUnits, 'id');
          saveToStorage(STORAGE_KEYS.UNITS, merged);
          return merged;
        });
      }
      if (sbCategories && sbCategories.length > 0) {
        setCategories(() => {
          const valid = sbCategories.map((c) => ({
            id: String(c.id),
            name: String(c.name),
          }));
          saveToStorage(STORAGE_KEYS.CATEGORIES, valid);
          return valid;
        });
      }
      if (sbSuppliers && sbSuppliers.length > 0) {
        setSuppliers((prev) => {
          const merged = mergeByField(prev, sbSuppliers, 'id');
          saveToStorage(STORAGE_KEYS.SUPPLIERS, merged);
          return merged;
        });
      }
      if (sbMenus && sbMenus.length > 0) {
        const isMenuDeleted = (m: Menu) => {
          const idStr = String(m.id).trim().toLowerCase();
          return deletedMenuIdsRef.current.has(idStr) || deletedMenuIdsRef.current.has(String(m.id).trim());
        };
        const remoteActive = sbMenus.filter((m) => !isMenuDeleted(m));
        setMenus((prev) => {
          const localActive = prev.filter((m) => !isMenuDeleted(m));
          const remoteMap = new Map(remoteActive.map((m) => [String(m.id).toLowerCase(), m]));
          const localOnly = localActive.filter((localItem) => {
            const isLocalOnly = !remoteMap.has(String(localItem.id).toLowerCase());
            const isCustom = String(localItem.id).startsWith('m-') || String(localItem.id).startsWith('menu_');
            const isSeed = INITIAL_MENUS.some((s) => s.id === localItem.id);
            return isLocalOnly && isCustom && !isSeed;
          });
          const merged = [...remoteActive, ...localOnly];
          saveToStorage(STORAGE_KEYS.MENUS, merged);
          return merged;
        });
      }
      if (sbRecipes && sbRecipes.length > 0) {
        setRecipes((prev) => {
          const merged = mergeByField(prev, sbRecipes, 'id');
          saveToStorage(STORAGE_KEYS.RECIPES, merged);
          return merged;
        });
      }
      if (recipeDetailsData && recipeDetailsData.length > 0) {
        setRecipeDetails((prev) => {
          const baseDetails = mergeByField(INITIAL_RECIPE_DETAILS, prev, 'id');
          const combined = sanitizeRecipeDetails(mergeByField(baseDetails, recipeDetailsData, 'id'));
          
          // Identify menus/recipes that have user-saved details (rd-rec-... and rd-rec-prep-...)
          const userSavedRecipeIds = new Set<string>();
          const userSavedMenuIds = new Set<string>();

          const allRecipes = mergeByField(INITIAL_RECIPES, recipes, 'id');

          for (const rd of combined) {
            if (rd && rd.id && (rd.id.startsWith('rd-rec-') || rd.id.startsWith('rd-rec-prep-'))) {
              if (rd.recipe_id) userSavedRecipeIds.add(rd.recipe_id);
              const foundRec = allRecipes.find((r) => r.id === rd.recipe_id);
              if (foundRec && foundRec.menu_id) {
                userSavedMenuIds.add(foundRec.menu_id);
              }
            }
          }

          // Filter out legacy non-user-saved items for recipes/menus that have user-saved details
          const filtered = combined.filter((rd) => {
            if (!rd || !rd.recipe_id) return false;
            const isUserSaved = rd.id && (rd.id.startsWith('rd-rec-') || rd.id.startsWith('rd-rec-prep-'));
            if (isUserSaved) return true;

            const foundRec = allRecipes.find((r) => r.id === rd.recipe_id);
            const rdMenuId = foundRec?.menu_id;

            const belongsToUserSavedRecipe = userSavedRecipeIds.has(rd.recipe_id);
            const belongsToUserSavedMenu = rdMenuId ? userSavedMenuIds.has(rdMenuId) : false;

            if (belongsToUserSavedRecipe || belongsToUserSavedMenu) {
              return false; // Discard stale seed items ONLY when user has saved custom details for THIS SPECIFIC MENU!
            }
            return true;
          });

          saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, filtered);

          // Extract and sync prepare formulas into prepareFormulas state
          const extractedPrepFormulas: Record<string, Array<{ ingredient_id: string; quantity: number }>> = {};
          for (const rd of filtered) {
            if (rd.id?.startsWith('rd-rec-prep-') || rd.recipe_id?.startsWith('rec-prep-')) {
              let prepIngId = '';
              if (rd.recipe_id?.startsWith('rec-prep-')) {
                prepIngId = rd.recipe_id.replace('rec-prep-', '');
              } else if (rd.id?.startsWith('rd-rec-prep-')) {
                const parts = rd.id.replace('rd-rec-prep-', '').split('-');
                if (parts.length >= 2) {
                  prepIngId = parts[0];
                }
              }
              if (prepIngId) {
                if (!extractedPrepFormulas[prepIngId]) extractedPrepFormulas[prepIngId] = [];
                if (!extractedPrepFormulas[prepIngId].some((x) => x.ingredient_id === rd.ingredient_id)) {
                  extractedPrepFormulas[prepIngId].push({
                    ingredient_id: rd.ingredient_id,
                    quantity: Number(rd.quantity) || 0,
                  });
                }
              }
            }
          }
          if (Object.keys(extractedPrepFormulas).length > 0) {
            setPrepareFormulas((prevPrep) => {
              const nextPrep = { ...prevPrep, ...extractedPrepFormulas };
              saveToStorage(STORAGE_KEYS.PREPARE_FORMULAS, nextPrep);
              return nextPrep;
            });
          }

          return filtered;
        });
      } else {
        // If Supabase returned no recipe details at all, ensure seed recipe details are preserved
        setRecipeDetails((prev) => {
          const sanitized = sanitizeRecipeDetails(mergeByField(INITIAL_RECIPE_DETAILS, prev, 'id'));
          saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, sanitized);
          return sanitized;
        });
      }

      const cleanTransactions = (sbTransactions || []).map((t) => ({
        ...t,
        id: String(t.id),
        type: String(t.type) as TransactionType,
        transaction_date: t.transaction_date || new Date().toISOString(),
        reference_no: String(t.reference_no || ''),
        notes: t.notes || '',
        created_by: t.created_by || '',
        created_at: t.created_at || new Date().toISOString(),
      }));

      const cleanMovements = (stockMovementsData || []).map((m) => {
        let trxId = m.transaction_id ? String(m.transaction_id) : undefined;
        if (!trxId && m.description && cleanTransactions.length > 0) {
          const match = cleanTransactions.find(
            (t) => t.reference_no && m.description.includes(t.reference_no)
          );
          if (match) trxId = match.id;
        }
        return {
          ...m,
          id: String(m.id),
          transaction_id: trxId,
          ingredient_id: String(m.ingredient_id),
          type: String(m.type) as 'in' | 'out',
          quantity: Number(m.quantity) || 0,
          balance_after: m.balance_after !== undefined && m.balance_after !== null ? Number(m.balance_after) : undefined,
          description: m.description || '',
          created_at: m.created_at || new Date().toISOString(),
        };
      });

      const cleanIngredients = (sbIngredients || []).map((ing) => ({
        ...ing,
        id: String(ing.id),
        code: String(ing.code || ''),
        name: String(ing.name || ''),
        current_stock: Number(ing.current_stock) || 0,
        min_stock: Number(ing.min_stock) || 0,
        cost_per_unit: Number(ing.cost_per_unit ?? ing.cogs_per_unit) || 0,
      }));

      // Filter out remotely fetched transactions and movements that were deleted locally
      const activeRemoteTrxs = cleanTransactions.filter((t) => {
        if (deletedTrxIdsRef.current.has(t.id)) return false;
        if (t.reference_no && deletedTrxIdsRef.current.has(t.reference_no)) return false;
        return true;
      });

      const activeRemoteMovs = cleanMovements.filter((m) => {
        if (m.transaction_id && deletedTrxIdsRef.current.has(m.transaction_id)) return false;
        if (m.description) {
          for (const delRef of deletedTrxIdsRef.current) {
            if (delRef && m.description.includes(delRef)) return false;
          }
        }
        return true;
      });

      // Update transactions preserving local active transactions
      let currentTransactionsList = activeRemoteTrxs;
      setTransactions((prevTrxs) => {
        const localActive = prevTrxs.filter((t) => {
          if (deletedTrxIdsRef.current.has(t.id)) return false;
          if (t.reference_no && deletedTrxIdsRef.current.has(t.reference_no)) return false;
          return true;
        });
        const merged = mergeByField(localActive, activeRemoteTrxs, 'id');
        const sorted = [...merged].sort((a, b) => {
          const timeA = new Date(a.created_at).getTime() || 0;
          const timeB = new Date(b.created_at).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id).localeCompare(String(a.id));
        });
        currentTransactionsList = sorted;
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, sorted);
        return sorted;
      });

      // Update stock movements preserving local active movements & healing missing transaction_ids
      let currentMovementsList = activeRemoteMovs;
      setStockMovements((prevMovs) => {
        const localActive = prevMovs.filter((m) => {
          if (m.transaction_id && deletedTrxIdsRef.current.has(m.transaction_id)) return false;
          if (m.description) {
            for (const delRef of deletedTrxIdsRef.current) {
              if (delRef && m.description.includes(delRef)) return false;
            }
          }
          return true;
        });
        const merged = mergeByField(localActive, activeRemoteMovs, 'id');
        const healed = merged.map((m) => {
          let trxId = m.transaction_id;
          if (!trxId && m.description && currentTransactionsList.length > 0) {
            const match = currentTransactionsList.find(
              (t) => t.reference_no && m.description.includes(t.reference_no)
            );
            if (match) trxId = match.id;
          }
          return { ...m, transaction_id: trxId };
        });

        const sorted = [...healed].sort((a, b) => {
          const timeA = new Date(a.created_at).getTime() || 0;
          const timeB = new Date(b.created_at).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id).localeCompare(String(a.id));
        });
        currentMovementsList = sorted;
        saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, sorted);
        return sorted;
      });

      setIngredients((prevIngs) => {
        const isDeleted = (ing: Ingredient) => {
          const idStr = String(ing.id).trim();
          const codeStr = String(ing.code || '').trim();
          return (
            deletedIngIdsRef.current.has(idStr) ||
            deletedIngIdsRef.current.has(idStr.toLowerCase()) ||
            (codeStr !== '' &&
              (deletedIngIdsRef.current.has(codeStr) || deletedIngIdsRef.current.has(codeStr.toLowerCase())))
          );
        };

        const localActive = prevIngs.filter((ing) => !isDeleted(ing));
        const remoteActive = cleanIngredients.filter((ing) => !isDeleted(ing));
        
        let resolved: Ingredient[] = [];
        if (remoteActive.length > 0) {
          const remoteMap = new Map(remoteActive.map((i) => [String(i.id).toLowerCase(), i]));
          const localOnly = localActive.filter((localItem) => {
            const isLocalOnly = !remoteMap.has(String(localItem.id).toLowerCase());
            const isCustom = String(localItem.id).startsWith('ing-') || String(localItem.id).startsWith('ing_');
            const isSeed = INITIAL_INGREDIENTS.some((s) => s.id === localItem.id || s.code === localItem.code);
            return isLocalOnly && isCustom && !isSeed;
          });
          resolved = [...remoteActive, ...localOnly];
        } else {
          resolved = localActive;
        }

        const mergedIngs = resolved.map((ing) => ({
          ...ing,
          current_stock: getIngredientCurrentStock(ing, currentMovementsList),
        }));
        saveToStorage(STORAGE_KEYS.INGREDIENTS, mergedIngs);
        return mergedIngs;
      });

      // Automatically push initial master data to Supabase only if ingredients table is empty
      if (!sbIngredients || sbIngredients.length === 0) {
        pushAllToSupabase();
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (e: any) {
      console.warn('Supabase auto-sync notice:', e);
      setSupabaseError(e?.message || 'Koneksi Supabase error');
    }
  };

  // Push ALL current data to Supabase (Initial seed or force sync)
  const pushAllToSupabase = async (): Promise<boolean> => {
    setIsSyncing(true);
    setSupabaseError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setSupabaseError('Supabase client tidak dikonfigurasi');
        return false;
      }

      // Clean reference tables
      const cleanUnits = units.map((u) => ({ id: String(u.id), name: String(u.name), abbreviation: String(u.abbreviation) }));
      const cleanCategories = categories.map((c) => ({ id: String(c.id), name: String(c.name) }));
      const cleanSuppliers = suppliers.map((s) => ({
        id: String(s.id),
        name: String(s.name),
        contact: s.contact || null,
        address: s.address || null,
      }));

      // Step 1: Push reference tables
      let refErr: any = null;
      try {
        const refResults = await Promise.all([
          supabase.from('units').upsert(cleanUnits),
          supabase.from('categories').upsert(cleanCategories),
          supabase.from('suppliers').upsert(cleanSuppliers),
        ]);
        refErr = refResults.find((r) => r.error)?.error;
      } catch (err: any) {
        refErr = err;
      }

      if (refErr) {
        const isFetchFailed = String(refErr?.message || refErr).toLowerCase().includes('failed to fetch');
        if (!isFetchFailed) {
          console.warn('Push reference tables warning:', refErr);
        }
        const isRls = refErr.message?.toLowerCase().includes('security') || refErr.message?.toLowerCase().includes('policy') || refErr.code === '42501';
        setSupabaseError(
          isFetchFailed
            ? 'Koneksi ke Supabase offline/terputus. Data tetap aman di penyimpanan lokal.'
            : isRls
            ? 'Akses Simpan Supabase diblokir (RLS). Klik "Fix Supabase" di kanan atas.'
            : (refErr.message || 'Gagal push kategori/satuan')
        );
        return false;
      }

      // Step 2: Push ingredients and menus
      const activeIngredients = ingredients.filter(
        (ing) =>
          !deletedIngIdsRef.current.has(String(ing.id).trim()) &&
          !deletedIngIdsRef.current.has(String(ing.code || '').trim())
      );
      const activeMenus = menus;
      const activeRecipes = recipes;
      const activeRecipeDetails = recipeDetails;

      const cleanIngs = activeIngredients.map((ing) => ({
        id: String(ing.id),
        code: String(ing.code || ''),
        name: String(ing.name || ''),
        category_id: ing.category_id ? String(ing.category_id) : null,
        unit_id: ing.unit_id ? String(ing.unit_id) : null,
        type: ing.type || 'raw',
        min_stock: Number(ing.min_stock) || 0,
        current_stock: getIngredientCurrentStock(ing, stockMovements),
        is_active: ing.is_active ?? true,
        cost_per_unit: Number(ing.cost_per_unit) || 0,
        cogs_per_unit: Number(ing.cost_per_unit) || 0,
      }));

      const cleanMenus = activeMenus.map((m) => {
        const catName = m.category || 'Umum';
        return {
          id: String(m.id),
          name: String(m.name),
          category: String(catName),
          price: Number(m.price) || 0,
          is_active: m.is_active ?? true,
        };
      });

      const cleanRecipes = activeRecipes.map((r) => {
        const isMenuRecipe = activeMenus.some((m) => m.id === r.menu_id);
        return {
          id: String(r.id),
          menu_id: isMenuRecipe ? String(r.menu_id) : null,
          version: Number(r.version) || 1,
          is_active: r.is_active ?? true,
          notes: r.notes || null,
          created_at: r.created_at || new Date().toISOString(),
        };
      });

      const cleanRecipeDetails = activeRecipeDetails
        .filter((rd) => activeIngredients.some((i) => i.id === rd.ingredient_id))
        .map((rd) => ({
          id: String(rd.id),
          recipe_id: String(rd.recipe_id),
          ingredient_id: String(rd.ingredient_id),
          quantity: Number(rd.quantity) || 0,
        }));

      // Step 2: Push ingredients and menus sequentially
      if (cleanIngs.length > 0) {
        const { error: ingErr } = await supabase.from('ingredients').upsert(cleanIngs);
        if (ingErr) {
          console.warn('Push ingredients warning:', ingErr);
          const isRls = ingErr.message?.toLowerCase().includes('security') || ingErr.message?.toLowerCase().includes('policy') || ingErr.code === '42501';
          setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS Policy).' : (ingErr.message || 'Gagal push bahan baku'));
          return false;
        }
      }

      if (cleanMenus.length > 0) {
        let { error: menuErr } = await supabase.from('menus').upsert(cleanMenus);
        if (menuErr) {
          const cleanMenusNoActive = cleanMenus.map(({ is_active, ...rest }) => rest);
          const res = await supabase.from('menus').upsert(cleanMenusNoActive);
          menuErr = res.error;
        }
        if (menuErr) {
          console.warn('Push menus warning:', menuErr);
          const isRls = menuErr.message?.toLowerCase().includes('security') || menuErr.message?.toLowerCase().includes('policy') || menuErr.code === '42501';
          setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS Policy).' : (menuErr.message || 'Gagal push menu'));
          return false;
        }
      }

      if (cleanRecipes.length > 0) {
        let { error: recErr } = await supabase.from('recipes').upsert(cleanRecipes);
        if (recErr) {
          const cleanRecsNoActive = cleanRecipes.map(({ is_active, ...rest }) => rest);
          const res = await supabase.from('recipes').upsert(cleanRecsNoActive);
          recErr = res.error;
        }
        if (recErr) {
          console.warn('Push recipes warning:', recErr);
          const isRls = recErr.message?.toLowerCase().includes('security') || recErr.message?.toLowerCase().includes('policy') || recErr.code === '42501';
          setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS Policy).' : (recErr.message || 'Gagal push resep'));
          return false;
        }
      }

      if (cleanRecipeDetails.length > 0) {
        let { error: rdErr } = await supabase.from('recipe_details').upsert(cleanRecipeDetails);
        try { await supabase.from('recipe_items').upsert(cleanRecipeDetails); } catch {}
        if (rdErr && rdErr.message?.includes('does not exist')) {
          const res = await supabase.from('recipe_items').upsert(cleanRecipeDetails);
          rdErr = res.error;
        }
        if (rdErr) {
          console.warn('Push recipe details warning:', rdErr);
        }
      }

      // Step 3: Explicitly update current_stock in Supabase table for every ingredient
      for (const ing of cleanIngs) {
        await supabase
          .from('ingredients')
          .update({ current_stock: ing.current_stock })
          .eq('id', ing.id);
      }

      // Step 4: Push transactions and stock movements sequentially
      const cleanTrxs = transactions.map((t) => {
        const validSupplier = t.supplier_id && suppliers.some((s) => s.id === t.supplier_id);
        const validMenu = t.menu_id && menus.some((m) => m.id === t.menu_id);
        return {
          id: String(t.id),
          type: String(t.type),
          transaction_date: t.transaction_date || new Date().toISOString(),
          reference_no: String(t.reference_no || ''),
          supplier_id: validSupplier ? String(t.supplier_id) : null,
          menu_id: validMenu ? String(t.menu_id) : null,
          portion_count: t.portion_count !== undefined && t.portion_count !== null ? Number(t.portion_count) : null,
          notes: t.notes || null,
          created_by: t.created_by || null,
          adjustment_reason: t.adjustment_reason || null,
          created_at: t.created_at || new Date().toISOString(),
        };
      });

      const cleanMovs = stockMovements.map((m) => {
        const foundIng = ingredients.find(
          (i) =>
            i.id === m.ingredient_id ||
            String(i.code).toLowerCase() === String(m.ingredient_id).toLowerCase()
        );
        const ingId = foundIng ? String(foundIng.id) : String(m.ingredient_id);
        const validTrx = m.transaction_id && transactions.some((t) => t.id === m.transaction_id);

        return {
          id: String(m.id),
          transaction_id: validTrx ? String(m.transaction_id) : null,
          ingredient_id: ingId,
          type: String(m.type),
          quantity: Number(m.quantity) || 0,
          balance_after: Number(m.balance_after ?? 0),
          description: m.description || null,
          created_at: m.created_at || new Date().toISOString(),
        };
      });

      if (cleanTrxs.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < cleanTrxs.length; i += chunkSize) {
          const chunk = cleanTrxs.slice(i, i + chunkSize);
          const { error: trxErr } = await supabase.from('transactions').upsert(chunk);
          if (trxErr) {
            console.warn('Push transactions warning:', trxErr);
            const isRls = trxErr.message?.toLowerCase().includes('security') || trxErr.message?.toLowerCase().includes('policy') || trxErr.code === '42501';
            setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS Policy).' : (trxErr.message || 'Gagal push transaksi'));
            return false;
          }
        }
      }

      if (cleanMovs.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < cleanMovs.length; i += chunkSize) {
          const chunk = cleanMovs.slice(i, i + chunkSize);
          let { error: movErr } = await supabase.from('stock_movements').upsert(chunk);
          if (movErr) {
            try { await supabase.from('stock_moved').upsert(chunk); } catch {}
            // Fallback row by row
            for (const row of chunk) {
              try {
                await supabase.from('stock_movements').upsert([row]);
              } catch {}
            }
          }
        }
      }

      setLastSyncedAt(new Date());
      setSupabaseError(null);
      return true;
    } catch (e: any) {
      console.warn('Push exception:', e);
      setSupabaseError(e?.message || 'Gagal koneksi Supabase');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto Sync on Mount, Realtime Subscription & Polling for Multi-Device Consistency
  useEffect(() => {
    // 0. Auto-reconcile historical stock deductions and standardize categories on mount
    try {
      const {
        reconciledTransactions,
        reconciledMovements,
        reconciledIngredients,
        repairedCount,
      } = reconcileHistoricalTransactionsAndMovements(
        transactions,
        stockMovements,
        ingredients,
        recipeDetails,
        recipes,
        menus,
        prepareFormulas
      );

      if (repairedCount > 0 || reconciledIngredients.some((ing, idx) => ing.current_stock !== ingredients[idx]?.current_stock || ing.category_id !== ingredients[idx]?.category_id)) {
        setTransactions(reconciledTransactions);
        setStockMovements(reconciledMovements);
        setIngredients(reconciledIngredients);

        saveToStorage(STORAGE_KEYS.TRANSACTIONS, reconciledTransactions);
        saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, reconciledMovements);
        saveToStorage(STORAGE_KEYS.INGREDIENTS, reconciledIngredients);
      }
    } catch (e) {
      console.warn('Initial reconciliation notice:', e);
    }

    // 1. Pull from Supabase directly on startup
    pullFromSupabase();

    // 2. Refresh immediately when window tab is focused, visible, or online
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        pullFromSupabase();
      }
    };
    const handleOnline = () => {
      pullFromSupabase();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);

    // 3. Ultra-fast polling every 3 seconds for instant multi-device cross-sync
    const interval = setInterval(() => {
      pullFromSupabase();
    }, 3000);

    // 4. Realtime subscription to Supabase postgres_changes and broadcast channel
    let channel: any = null;
    try {
      const supabase = getSupabase();
      if (supabase) {
        channel = supabase
          .channel('mecamocha-realtime-channel')
          .on('broadcast', { event: 'mecamocha_sync' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'recipe_details' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
            pullFromSupabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => {
            pullFromSupabase();
          })
          .subscribe();
      }
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
      if (channel) {
        try {
          const supabase = getSupabase();
          if (supabase) supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  // Sync to local storage
  useEffect(() => saveToStorage(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);
  useEffect(() => saveToStorage(STORAGE_KEYS.UNITS, units), [units]);
  useEffect(() => saveToStorage(STORAGE_KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.INGREDIENTS, ingredients), [ingredients]);
  useEffect(() => saveToStorage(STORAGE_KEYS.MENUS, menus), [menus]);
  useEffect(() => saveToStorage(STORAGE_KEYS.RECIPES, recipes), [recipes]);
  useEffect(() => saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, recipeDetails), [recipeDetails]);
  useEffect(() => saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions), [transactions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements), [stockMovements]);

  const isSuperAdmin = currentUser?.is_superadmin || currentUser?.role === 'super_admin';

  // User Handlers
  const addUser = (userData: Omit<AppUser, 'id' | 'created_at'>) => {
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      ...userData,
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser.id === id) {
      setCurrentUser(users.find((u) => u.id !== id) || users[0]);
    }
  };

  // Master Data Handlers
  const addUnit = async (unit: Omit<Unit, 'id'>) => {
    const newUnit = { id: `u-${Date.now()}`, ...unit };
    setUnits((prev) => {
      const next = [...prev, newUnit];
      saveToStorage(STORAGE_KEYS.UNITS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('units').upsert([newUnit]);
      }
    } catch (e) {
      console.warn('Error upserting unit to Supabase:', e);
    }
  };

  const updateUnit = async (id: string, unit: Omit<Unit, 'id'>) => {
    const updated = { id, ...unit };
    setUnits((prev) => {
      const next = prev.map((u) => (u.id === id ? updated : u));
      saveToStorage(STORAGE_KEYS.UNITS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('units').upsert([updated]);
      }
    } catch (e) {
      console.warn('Error updating unit in Supabase:', e);
    }
  };

  const deleteUnit = async (id: string) => {
    setUnits((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveToStorage(STORAGE_KEYS.UNITS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('units').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Error deleting unit from Supabase:', e);
    }
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const newCat = { id: `c-${Date.now()}`, ...cat };
    setCategories((prev) => {
      const next = [...prev, newCat];
      saveToStorage(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('categories').upsert([newCat]);
      }
    } catch (e) {
      console.warn('Error upserting category to Supabase:', e);
    }
  };

  const updateCategory = async (id: string, cat: Omit<Category, 'id'>) => {
    const updated = { id, ...cat };
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? updated : c));
      saveToStorage(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('categories').upsert([updated]);
      }
    } catch (e) {
      console.warn('Error updating category in Supabase:', e);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveToStorage(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('categories').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Error deleting category from Supabase:', e);
    }
  };

  const addSupplier = async (sup: Omit<Supplier, 'id'>) => {
    const newSup = { id: `s-${Date.now()}`, ...sup };
    setSuppliers((prev) => {
      const next = [...prev, newSup];
      saveToStorage(STORAGE_KEYS.SUPPLIERS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('suppliers').upsert([{
          id: String(newSup.id),
          name: String(newSup.name),
          contact: newSup.contact || null,
          address: newSup.address || null,
        }]);
      }
    } catch (e) {
      console.warn('Error upserting supplier to Supabase:', e);
    }
  };

  const updateSupplier = async (id: string, sup: Omit<Supplier, 'id'>) => {
    const updated = { id, ...sup };
    setSuppliers((prev) => {
      const next = prev.map((s) => (s.id === id ? updated : s));
      saveToStorage(STORAGE_KEYS.SUPPLIERS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('suppliers').upsert([{
          id: String(id),
          name: String(sup.name),
          contact: sup.contact || null,
          address: sup.address || null,
        }]);
      }
    } catch (e) {
      console.warn('Error updating supplier in Supabase:', e);
    }
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEYS.SUPPLIERS, next);
      return next;
    });
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('suppliers').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Error deleting supplier from Supabase:', e);
    }
  };

  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'current_stock'> & { initial_stock?: number }) => {
    const initialStock = ingData.initial_stock || 0;
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      code: ingData.code || `ING-${Math.floor(100 + Math.random() * 900)}`,
      name: ingData.name,
      category_id: normalizeIngredientCategory(ingData),
      unit_id: ingData.unit_id,
      type: ingData.type,
      min_stock: ingData.min_stock,
      current_stock: initialStock,
      is_active: ingData.is_active ?? true,
      cost_per_unit: ingData.cost_per_unit || 0,
    };

    setIngredients((prev) => {
      const next = [...prev, newIng];
      saveToStorage(STORAGE_KEYS.INGREDIENTS, next);
      return next;
    });

    let initTrx: Transaction | undefined;
    let initMov: StockMovement | undefined;

    // Record initial stock movement if > 0
    if (initialStock > 0) {
      const initTrxId = `trx-init-${Date.now()}`;
      initTrx = {
        id: initTrxId,
        type: 'adjustment',
        transaction_date: new Date().toISOString(),
        reference_no: generateRefNo('INIT'),
        notes: 'Stok Awal Tambah Bahan Baku',
        created_by: currentUser.name,
        adjustment_reason: 'Stock Opname',
        created_at: new Date().toISOString(),
      };

      initMov = {
        id: `mov-init-${Date.now()}`,
        transaction_id: initTrxId,
        ingredient_id: newIng.id,
        type: 'in',
        quantity: initialStock,
        balance_after: initialStock,
        description: 'Pencatatan Stok Awal Bahan Baru',
        created_at: new Date().toISOString(),
      };

      setTransactions((prev) => [initTrx!, ...prev]);
      setStockMovements((prev) => [initMov!, ...prev]);
    }

    syncDataToSupabase([newIng], initTrx, initMov ? [initMov] : []);
  };

  const bulkAddIngredients = (items: Array<Omit<Ingredient, 'id' | 'current_stock'> & { initial_stock?: number }>) => {
    const newIngs: Ingredient[] = [];
    const newTrxs: Transaction[] = [];
    const newMovs: StockMovement[] = [];

    items.forEach((ingData, idx) => {
      const initialStock = ingData.initial_stock || 0;
      const ingId = `ing-${Date.now()}-${idx}`;
      const newIng: Ingredient = {
        id: ingId,
        code: ingData.code || `ING-${Math.floor(1000 + Math.random() * 9000)}`,
        name: ingData.name,
        category_id: normalizeIngredientCategory(ingData),
        unit_id: ingData.unit_id || '',
        type: ingData.type || 'raw',
        min_stock: ingData.min_stock || 0,
        current_stock: initialStock,
        is_active: ingData.is_active ?? true,
        cost_per_unit: ingData.cost_per_unit || 0,
      };
      newIngs.push(newIng);

      if (initialStock > 0) {
        const initTrxId = `trx-init-${Date.now()}-${idx}`;
        const initTrx: Transaction = {
          id: initTrxId,
          type: 'adjustment',
          transaction_date: new Date().toISOString(),
          reference_no: generateRefNo('INIT'),
          notes: 'Stok Awal Bulk Import Master Bahan',
          created_by: currentUser.name,
          adjustment_reason: 'Stock Opname',
          created_at: new Date().toISOString(),
        };
        const initMov: StockMovement = {
          id: `mov-init-${Date.now()}-${idx}`,
          transaction_id: initTrxId,
          ingredient_id: ingId,
          type: 'in',
          quantity: initialStock,
          balance_after: initialStock,
          description: 'Pencatatan Stok Awal Impor Massal',
          created_at: new Date().toISOString(),
        };
        newTrxs.push(initTrx);
        newMovs.push(initMov);
      }
    });

    setIngredients((prev) => {
      const next = [...prev, ...newIngs];
      saveToStorage(STORAGE_KEYS.INGREDIENTS, next);
      return next;
    });
    if (newTrxs.length > 0) setTransactions((prev) => [...newTrxs, ...prev]);
    if (newMovs.length > 0) setStockMovements((prev) => [...newMovs, ...prev]);

    syncDataToSupabase(newIngs, newTrxs[0], newMovs);
  };

  const updateIngredient = (id: string, ing: Partial<Ingredient>) => {
    let updatedItem: Ingredient | undefined;
    setIngredients((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const merged = { ...item, ...ing };
          updatedItem = {
            ...merged,
            category_id: normalizeIngredientCategory(merged),
          };
          return updatedItem;
        }
        return item;
      });
      saveToStorage(STORAGE_KEYS.INGREDIENTS, next);
      return next;
    });

    if (updatedItem) {
      syncDataToSupabase([updatedItem]);

      // Direct explicit Supabase update to guarantee category_id and other fields are saved
      try {
        const supabase = getSupabase();
        if (supabase) {
          supabase
            .from('ingredients')
            .update({
              name: String(updatedItem.name || ''),
              code: String(updatedItem.code || ''),
              category_id: updatedItem.category_id ? String(updatedItem.category_id) : null,
              unit_id: updatedItem.unit_id ? String(updatedItem.unit_id) : null,
              type: updatedItem.type || 'raw',
              min_stock: Number(updatedItem.min_stock) || 0,
              cost_per_unit: Number(updatedItem.cost_per_unit) || 0,
              cogs_per_unit: Number(updatedItem.cost_per_unit) || 0,
              is_active: updatedItem.is_active !== false,
            })
            .eq('id', String(id))
            .then(({ error }) => {
              if (error) console.warn('Direct update ingredient supabase error:', error);
            });
        }
      } catch (err) {
        console.warn('Direct update ingredient error:', err);
      }
    }
  };

  const deleteIngredient = async (id: string) => {
    const cleanId = String(id).trim();
    const targetIng = ingredients.find(
      (i) =>
        String(i.id).trim().toLowerCase() === cleanId.toLowerCase() ||
        String(i.code || '').trim().toLowerCase() === cleanId.toLowerCase()
    );

    const ingId = targetIng ? String(targetIng.id).trim() : cleanId;
    const ingCode = targetIng ? String(targetIng.code || '').trim() : undefined;

    deletedIngIdsRef.current.add(ingId);
    deletedIngIdsRef.current.add(ingId.toLowerCase());
    if (ingCode) {
      deletedIngIdsRef.current.add(ingCode);
      deletedIngIdsRef.current.add(ingCode.toLowerCase());
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.DELETED_ING_IDS,
        JSON.stringify(Array.from(deletedIngIdsRef.current))
      );
    } catch {}

    setIngredients((prev) => {
      const next = prev.filter((item) => {
        const itemId = String(item.id).trim().toLowerCase();
        const itemCode = String(item.code || '').trim().toLowerCase();
        return (
          itemId !== ingId.toLowerCase() &&
          (!ingCode || itemCode !== ingCode.toLowerCase())
        );
      });
      saveToStorage(STORAGE_KEYS.INGREDIENTS, next);
      return next;
    });

    try {
      const supabase = getSupabase();
      if (supabase) {
        // Delete child rows referencing this ingredient first to satisfy Foreign Key constraints
        try { await supabase.from('recipe_details').delete().eq('ingredient_id', ingId); } catch {}
        try { await supabase.from('recipe_items').delete().eq('ingredient_id', ingId); } catch {}
        try { await supabase.from('stock_movements').delete().eq('ingredient_id', ingId); } catch {}
        try { await supabase.from('stock_moved').delete().eq('ingredient_id', ingId); } catch {}

        if (ingCode) {
          try { await supabase.from('recipe_details').delete().eq('ingredient_id', ingCode); } catch {}
          try { await supabase.from('recipe_items').delete().eq('ingredient_id', ingCode); } catch {}
          try { await supabase.from('stock_movements').delete().eq('ingredient_id', ingCode); } catch {}
          try { await supabase.from('stock_moved').delete().eq('ingredient_id', ingCode); } catch {}
        }

        const { error: delErr } = await supabase.from('ingredients').delete().eq('id', ingId);
        if (delErr && ingCode) {
          await supabase.from('ingredients').delete().eq('code', ingCode);
        }
      }
    } catch (e) {
      console.warn('Error deleting ingredient from Supabase:', e);
    }
  };

  const addMenu = async (menuData: Omit<Menu, 'id'>) => {
    const newMenu: Menu = {
      id: `m-${Date.now()}`,
      ...menuData,
      price: Math.max(0, Number(menuData.price) || 0),
      is_active: menuData.is_active ?? true,
      active_recipe_version: 1,
    };
    const defaultRec: Recipe = {
      id: `rec-${newMenu.id}`,
      menu_id: newMenu.id,
      version: 1,
      is_active: true,
      notes: 'Resep Versi 1 (Awal)',
      created_at: new Date().toISOString(),
    };

    setMenus((prev) => {
      const next = [...prev, newMenu];
      saveToStorage(STORAGE_KEYS.MENUS, next);
      return next;
    });

    setRecipes((prev) => {
      const next = [...prev, defaultRec];
      saveToStorage(STORAGE_KEYS.RECIPES, next);
      return next;
    });

    broadcastSync('sync_start');

    try {
      const supabase = getSupabase();
      if (supabase) {
        let { error: mErr } = await supabase.from('menus').upsert([{
          id: String(newMenu.id),
          name: String(newMenu.name),
          category: String(newMenu.category || 'Umum'),
          price: Number(newMenu.price) || 0,
          is_active: newMenu.is_active ?? true,
        }]);
        if (mErr) {
          await supabase.from('menus').upsert([{
            id: String(newMenu.id),
            name: String(newMenu.name),
            category: String(newMenu.category || 'Umum'),
            price: Number(newMenu.price) || 0,
          }]);
        }

        let { error: rErr } = await supabase.from('recipes').upsert([{
          id: String(defaultRec.id),
          menu_id: String(defaultRec.menu_id),
          version: Number(defaultRec.version) || 1,
          is_active: true,
          notes: defaultRec.notes,
          created_at: defaultRec.created_at,
        }]);
        if (rErr) {
          await supabase.from('recipes').upsert([{
            id: String(defaultRec.id),
            menu_id: String(defaultRec.menu_id),
            version: Number(defaultRec.version) || 1,
          }]);
        }
      }
    } catch (e) {
      console.warn('Error saving menu to Supabase:', e);
    }
  };

  const updateMenu = async (id: string, menu: Partial<Menu>) => {
    const cleanId = String(id).trim();
    const existingMenu = menus.find(
      (m) => String(m.id).trim().toLowerCase() === cleanId.toLowerCase()
    );

    const finalPrice = menu.price !== undefined ? Math.max(0, Number(menu.price) || 0) : Number(existingMenu?.price || 0);

    const finalMenuObj: Menu = {
      id: existingMenu?.id || cleanId,
      name: menu.name !== undefined ? String(menu.name) : (existingMenu?.name || ''),
      category: menu.category !== undefined ? String(menu.category) : (existingMenu?.category || 'Umum'),
      price: finalPrice,
      is_active: menu.is_active !== undefined ? menu.is_active : (existingMenu?.is_active ?? true),
      active_recipe_version: menu.active_recipe_version !== undefined ? menu.active_recipe_version : (existingMenu?.active_recipe_version || 1),
    };

    setMenus((prev) => {
      const next = prev.map((m) => {
        if (String(m.id).trim().toLowerCase() === cleanId.toLowerCase()) {
          return finalMenuObj;
        }
        return m;
      });
      saveToStorage(STORAGE_KEYS.MENUS, next);
      return next;
    });

    broadcastSync('sync_start');

    try {
      const supabase = getSupabase();
      if (supabase) {
        const payload = {
          id: String(finalMenuObj.id),
          name: String(finalMenuObj.name),
          category: String(finalMenuObj.category || 'Umum'),
          price: Number(finalMenuObj.price) || 0,
          is_active: finalMenuObj.is_active ?? true,
        };

        let { error: mErr } = await supabase.from('menus').upsert([payload]);
        if (mErr) {
          console.warn('Upsert menu failed, attempting direct update in Supabase:', mErr);
          await supabase
            .from('menus')
            .update({
              name: payload.name,
              category: payload.category,
              price: payload.price,
              is_active: payload.is_active,
            })
            .eq('id', String(finalMenuObj.id));
        }
      }
    } catch (e) {
      console.warn('Error updating menu in Supabase:', e);
    }
  };

  const deleteMenu = async (id: string) => {
    const cleanId = String(id).trim();
    const targetMenu = menus.find(
      (m) => String(m.id).trim().toLowerCase() === cleanId.toLowerCase()
    );
    const menuId = targetMenu ? String(targetMenu.id).trim() : cleanId;

    deletedMenuIdsRef.current.add(menuId);
    deletedMenuIdsRef.current.add(menuId.toLowerCase());
    try {
      localStorage.setItem(
        STORAGE_KEYS.DELETED_MENU_IDS,
        JSON.stringify(Array.from(deletedMenuIdsRef.current))
      );
    } catch {}

    const relatedRecipes = recipes.filter(
      (r) => String(r.menu_id).trim().toLowerCase() === menuId.toLowerCase()
    );
    const relatedRecipeIds = relatedRecipes.map((r) => String(r.id));

    const nextMenus = menus.filter(
      (m) => String(m.id).trim().toLowerCase() !== menuId.toLowerCase()
    );
    const nextRecipes = recipes.filter(
      (r) => String(r.menu_id).trim().toLowerCase() !== menuId.toLowerCase()
    );
    const nextRecipeDetails = recipeDetails.filter(
      (rd) => !relatedRecipeIds.includes(String(rd.recipe_id))
    );

    setMenus(nextMenus);
    setRecipes(nextRecipes);
    setRecipeDetails(nextRecipeDetails);

    saveToStorage(STORAGE_KEYS.MENUS, nextMenus);
    saveToStorage(STORAGE_KEYS.RECIPES, nextRecipes);
    saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, nextRecipeDetails);

    try {
      const supabase = getSupabase();
      if (supabase) {
        for (const recId of relatedRecipeIds) {
          try { await supabase.from('recipe_details').delete().eq('recipe_id', recId); } catch {}
          try { await supabase.from('recipe_items').delete().eq('recipe_id', recId); } catch {}
        }
        try { await supabase.from('recipes').delete().eq('menu_id', menuId); } catch {}
        try { await supabase.from('menus').delete().eq('id', menuId); } catch {}
      }
    } catch (e) {
      console.warn('Error deleting menu from Supabase:', e);
    }
  };

  // Recipe Handlers
  const addRecipeVersion = async (
    menuId: string,
    notes: string,
    details: Array<{ ingredient_id: string; quantity: number }>
  ) => {
    const canonicalRecipeId = `rec-${menuId}`;
    const existingRecipe = recipes.find((r) => r.menu_id === menuId || r.id === canonicalRecipeId);
    const recipeId = existingRecipe ? existingRecipe.id : canonicalRecipeId;
    const recipeVersion = 1;

    const recipeObj: Recipe = {
      id: recipeId,
      menu_id: menuId,
      version: recipeVersion,
      is_active: true,
      notes: notes || `Resep ${menuId}`,
      created_at: existingRecipe ? existingRecipe.created_at : new Date().toISOString(),
    };

    // Deduplicate input details by ingredient_id
    const uniqueDetailsMap = new Map<string, number>();
    for (const d of details) {
      if (d.ingredient_id && Number(d.quantity) > 0) {
        uniqueDetailsMap.set(d.ingredient_id, Number(d.quantity));
      }
    }

    const newDetails: RecipeDetail[] = Array.from(uniqueDetailsMap.entries()).map(([ingId, qty]) => ({
      id: `rd-rec-${menuId}-${ingId}`,
      recipe_id: recipeId,
      ingredient_id: ingId,
      quantity: qty,
    }));

    // Clean recipes state: keep 1 recipe per menu_id
    setRecipes((prev) => {
      const next = [
        ...prev.filter((r) => r.menu_id !== menuId && r.id !== recipeId),
        recipeObj,
      ];
      saveToStorage(STORAGE_KEYS.RECIPES, next);
      return next;
    });

    // Build set of all recipe IDs associated with this menu
    const possibleRecipeIds = new Set<string>([
      recipeId,
      `rec-${menuId}`,
      `rec-${menuId.replace('-', '')}`,
      menuId,
    ]);
    recipes.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));

    // Replace all existing details for this recipe/menu with sanitized new details
    setRecipeDetails((prev) => {
      const next = sanitizeRecipeDetails([
        ...prev.filter(
          (rd) =>
            !rd ||
            !rd.recipe_id ||
            (!possibleRecipeIds.has(rd.recipe_id) &&
              !rd.id.includes(menuId) &&
              !rd.id.includes(recipeId))
        ),
        ...newDetails,
      ]);
      saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, next);
      return next;
    });

    setMenus((prev) => {
      const next = prev.map((m) => (m.id === menuId ? { ...m, active_recipe_version: recipeVersion } : m));
      saveToStorage(STORAGE_KEYS.MENUS, next);
      return next;
    });

    try {
      const supabase = getSupabase();
      if (supabase) {
        // Ensure menu exists in Supabase
        const targetMenu = menus.find((m) => m.id === menuId);
        if (targetMenu) {
          let { error: mErr } = await supabase.from('menus').upsert([{
            id: String(targetMenu.id),
            name: String(targetMenu.name),
            category: String(targetMenu.category || 'Umum'),
            price: Number(targetMenu.price) || 0,
            is_active: targetMenu.is_active ?? true,
          }]);
          if (mErr) {
            await supabase.from('menus').upsert([{
              id: String(targetMenu.id),
              name: String(targetMenu.name),
              category: String(targetMenu.category || 'Umum'),
              price: Number(targetMenu.price) || 0,
            }]);
          }
        }

        // Upsert recipe
        let { error: rErr } = await supabase.from('recipes').upsert([{
          id: String(recipeObj.id),
          menu_id: String(recipeObj.menu_id),
          version: Number(recipeObj.version),
          is_active: true,
          notes: recipeObj.notes,
          created_at: recipeObj.created_at,
        }]);
        if (rErr) {
          await supabase.from('recipes').upsert([{
            id: String(recipeObj.id),
            menu_id: String(recipeObj.menu_id),
            version: Number(recipeObj.version),
          }]);
        }

        // Delete old details in Supabase first to clear removed items
        try { await supabase.from('recipe_details').delete().eq('recipe_id', recipeId); } catch {}
        try { await supabase.from('recipe_items').delete().eq('recipe_id', recipeId); } catch {}

        // Upsert new details to BOTH recipe_details AND recipe_items
        const cleanDetails = newDetails.map((rd) => ({
          id: String(rd.id),
          recipe_id: String(rd.recipe_id),
          ingredient_id: String(rd.ingredient_id),
          quantity: Number(rd.quantity) || 0,
        }));

        try { await supabase.from('recipe_details').upsert(cleanDetails); } catch {}
        try { await supabase.from('recipe_items').upsert(cleanDetails); } catch {}
      }
    } catch (e) {
      console.warn('Error saving recipe to Supabase:', e);
    }
  };

  const setActiveRecipeVersion = (menuId: string, version: number) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.menu_id === menuId ? { ...r, is_active: r.version === version } : r
      )
    );
    setMenus((prev) =>
      prev.map((m) => (m.id === menuId ? { ...m, active_recipe_version: version } : m))
    );
  };

  const getMenuRecipeDetails = (menuId: string, version?: number) => {
    let recipe = recipes.find((r) => r.menu_id === menuId && r.is_active) || recipes.find((r) => r.menu_id === menuId);

    if (!recipe) {
      recipe = INITIAL_RECIPES.find((r) => r.menu_id === menuId && r.is_active) || INITIAL_RECIPES.find((r) => r.menu_id === menuId) || {
        id: `rec-${menuId}`,
        menu_id: menuId,
        version: 1,
        is_active: true,
        notes: `Resep ${menuId}`,
        created_at: new Date().toISOString(),
      };
    }

    const possibleRecipeIds = new Set<string>([
      recipe.id,
      `rec-${menuId}`,
      `rec-${menuId.replace('-', '')}`,
      menuId,
    ]);
    recipes.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));
    INITIAL_RECIPES.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));

    let rawDetails = recipeDetails.filter((rd) => rd && rd.recipe_id && possibleRecipeIds.has(rd.recipe_id));

    // Fallback to initial seed details if no details are found in active state
    if (rawDetails.length === 0) {
      rawDetails = INITIAL_RECIPE_DETAILS.filter((rd) => rd && rd.recipe_id && possibleRecipeIds.has(rd.recipe_id));
    }

    const userSaved = rawDetails.filter((rd) => rd.id && (rd.id.startsWith('rd-rec-') || rd.id.startsWith(`rd-${recipe.id}`)));
    const targetDetails = userSaved.length > 0 ? userSaved : rawDetails;

    const uniqueDetailsMap = new Map<string, RecipeDetail>();
    for (const rd of targetDetails) {
      if (rd && rd.ingredient_id) {
        uniqueDetailsMap.set(rd.ingredient_id, rd);
      }
    }

    const details = Array.from(uniqueDetailsMap.values()).map((rd) => {
      const ing = ingredients.find((i) => i.id === rd.ingredient_id) || INITIAL_INGREDIENTS.find((i) => i.id === rd.ingredient_id);
      const unit = units.find((u) => u.id === ing?.unit_id) || INITIAL_UNITS.find((u) => u.id === ing?.unit_id);
      return {
        ...rd,
        ingredient: ing,
        unit: unit,
      };
    });

    return { recipe, details };
  };

  const getPrepareFormula = (prepIngredientId: string) => {
    const cleanPrepId = String(prepIngredientId).trim();
    const canonicalRecipeId = `rec-prep-${cleanPrepId}`;
    let recipe = recipes.find((r) => r.menu_id === cleanPrepId || r.id === canonicalRecipeId);

    if (!recipe) {
      recipe = {
        id: canonicalRecipeId,
        menu_id: cleanPrepId,
        version: 1,
        is_active: true,
        notes: `Formula Prepare ${cleanPrepId}`,
        created_at: new Date().toISOString(),
      };
    }

    // 1. First priority: Check prepareFormulas direct state map or localStorage
    const formulaInState = prepareFormulas?.[cleanPrepId] || prepareFormulas?.[prepIngredientId];
    if (formulaInState && Array.isArray(formulaInState) && formulaInState.length > 0) {
      const details = formulaInState
        .filter((d) => d && d.ingredient_id)
        .map((d) => {
          const ing = ingredients.find(
            (i) =>
              String(i.id).trim().toLowerCase() === String(d.ingredient_id).trim().toLowerCase() ||
              String(i.code).trim().toLowerCase() === String(d.ingredient_id).trim().toLowerCase()
          );
          const unit = units.find((u) => u.id === ing?.unit_id);
          return {
            id: `rd-rec-prep-${cleanPrepId}-${d.ingredient_id}`,
            recipe_id: canonicalRecipeId,
            ingredient_id: d.ingredient_id,
            quantity: Number(d.quantity) || 0,
            ingredient: ing,
            unit: unit,
          };
        });
      if (details.length > 0) {
        return { recipe, details };
      }
    }

    // 2. Second priority: Search recipeDetails state
    const possibleRecipeIds = new Set<string>([
      recipe.id,
      canonicalRecipeId,
      cleanPrepId,
      `rec-${cleanPrepId}`,
    ]);

    const rawDetails = recipeDetails.filter(
      (rd) =>
        rd &&
        rd.ingredient_id &&
        (possibleRecipeIds.has(rd.recipe_id) ||
          rd.id?.includes(`rec-prep-${cleanPrepId}`) ||
          rd.id?.includes(cleanPrepId))
    );

    const details = rawDetails.map((rd) => {
      const ing = ingredients.find(
        (i) =>
          String(i.id).trim().toLowerCase() === String(rd.ingredient_id).trim().toLowerCase() ||
          String(i.code).trim().toLowerCase() === String(rd.ingredient_id).trim().toLowerCase()
      );
      const unit = units.find((u) => u.id === ing?.unit_id);
      return {
        ...rd,
        ingredient: ing,
        unit: unit,
      };
    });

    return { recipe, details };
  };

  const savePrepareFormula = async (
    prepIngredientId: string,
    details: Array<{ ingredient_id: string; quantity: number }>
  ) => {
    const cleanPrepId = String(prepIngredientId).trim();
    const canonicalRecipeId = `rec-prep-${cleanPrepId}`;
    const recipeObj: Recipe = {
      id: canonicalRecipeId,
      menu_id: cleanPrepId,
      version: 1,
      is_active: true,
      notes: `Formula Prepare Standard ${cleanPrepId}`,
      created_at: new Date().toISOString(),
    };

    const uniqueDetailsMap = new Map<string, number>();
    for (const d of details) {
      if (d.ingredient_id && Number(d.quantity) > 0) {
        uniqueDetailsMap.set(String(d.ingredient_id).trim(), Number(d.quantity));
      }
    }

    const cleanInputDetails = Array.from(uniqueDetailsMap.entries()).map(([ingId, qty]) => ({
      ingredient_id: ingId,
      quantity: qty,
    }));

    const newDetails: RecipeDetail[] = cleanInputDetails.map((item) => ({
      id: `rd-rec-prep-${cleanPrepId}-${item.ingredient_id}`,
      recipe_id: canonicalRecipeId,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
    }));

    // 1. Update prepareFormulas state and localStorage
    setPrepareFormulas((prev) => {
      const next = { ...prev, [cleanPrepId]: cleanInputDetails };
      saveToStorage(STORAGE_KEYS.PREPARE_FORMULAS, next);
      try {
        localStorage.setItem('mecamocha_prepare_formulas_v3', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Update recipes state and localStorage
    setRecipes((prev) => {
      const next = [
        ...prev.filter((r) => r.menu_id !== cleanPrepId && r.id !== canonicalRecipeId),
        recipeObj,
      ];
      saveToStorage(STORAGE_KEYS.RECIPES, next);
      return next;
    });

    // 3. Update recipeDetails state and localStorage
    setRecipeDetails((prev) => {
      const next = sanitizeRecipeDetails([
        ...prev.filter((rd) => rd && rd.recipe_id !== canonicalRecipeId && !rd.id?.includes(`rec-prep-${cleanPrepId}`)),
        ...newDetails,
      ]);
      saveToStorage(STORAGE_KEYS.RECIPE_DETAILS, next);
      return next;
    });

    broadcastSync('sync_start');

    try {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('recipes').upsert([{
            id: String(recipeObj.id),
            version: 1,
            is_active: true,
            notes: recipeObj.notes,
            created_at: recipeObj.created_at,
          }]);
        } catch {}

        try {
          await supabase.from('recipe_details').delete().eq('recipe_id', canonicalRecipeId);
        } catch {}

        const cleanDetails = newDetails.map((rd) => ({
          id: String(rd.id),
          recipe_id: String(rd.recipe_id),
          ingredient_id: String(rd.ingredient_id),
          quantity: Number(rd.quantity) || 0,
        }));
        try {
          await supabase.from('recipe_details').upsert(cleanDetails);
        } catch {}
      }
    } catch (e) {
      console.warn('Error saving prepare formula to Supabase:', e);
    }
  };

  // Transactions Handlers
  const addPurchaseTransaction = (
    date: string,
    supplierIdOrName: string,
    refNo: string,
    notes: string,
    items: PurchaseItemInput[]
  ) => {
    const now = Date.now();
    const trxId = `trx-pur-${now}`;
    const isoDate = createLocalDateTimeIso(date);
    const actualRefNo = refNo || generateRefNo('PUR');

    // Supplier auto-resolution: check by ID or Name; if new name, auto-create supplier
    let resolvedSupplierId = suppliers[0]?.id || '';
    const cleanSupplierInput = (supplierIdOrName || '').trim();

    if (cleanSupplierInput) {
      const matchById = suppliers.find((s) => s.id === cleanSupplierInput);
      const matchByName = suppliers.find(
        (s) => s.name.trim().toLowerCase() === cleanSupplierInput.toLowerCase()
      );

      if (matchById) {
        resolvedSupplierId = matchById.id;
      } else if (matchByName) {
        resolvedSupplierId = matchByName.id;
      } else {
        // Auto-create new supplier with the entered name
        const newSupId = `s-${now}`;
        const newSup: Supplier = {
          id: newSupId,
          name: cleanSupplierInput,
          contact: '',
          address: 'Input Manual Pembelian',
        };
        resolvedSupplierId = newSupId;
        setSuppliers((prev) => {
          const next = [...prev, newSup];
          saveToStorage(STORAGE_KEYS.SUPPLIERS, next);
          return next;
        });
        try {
          const supabase = getSupabase();
          if (supabase) {
            supabase.from('suppliers').upsert([newSup]).then();
          }
        } catch {}
      }
    }

    const newTrx: Transaction = {
      id: trxId,
      type: 'purchase',
      transaction_date: isoDate,
      reference_no: actualRefNo,
      supplier_id: resolvedSupplierId,
      notes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const targetId = String(item.ingredient_id || '').trim().toLowerCase();
      let ingIndex = updatedIngredients.findIndex(
        (i) =>
          String(i.id).trim().toLowerCase() === targetId ||
          String(i.code).trim().toLowerCase() === targetId
      );

      if (ingIndex === -1 && updatedIngredients.length > 0) {
        ingIndex = 0;
      }

      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const realIngId = String(currentIng.id);
        const qty = Number(item.quantity) || 0;
        const currentStock = getIngredientCurrentStock(currentIng, [...newMovements, ...stockMovements]);
        const newStock = currentStock + qty;

        updatedIngredients[ingIndex] = {
          ...currentIng,
          current_stock: newStock,
          cost_per_unit: item.unit_price > 0 ? Number(item.unit_price) : Number(currentIng.cost_per_unit),
        };

        const supplierName = suppliers.find((s) => s.id === resolvedSupplierId)?.name || cleanSupplierInput || 'Supplier';
        newMovements.push({
          id: `mov-${now}-${index}`,
          transaction_id: trxId,
          ingredient_id: realIngId,
          type: 'in',
          quantity: qty,
          balance_after: newStock,
          description: `Pembelian dari ${supplierName} (${actualRefNo})`,
          created_at: new Date(new Date(isoDate).getTime() + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    saveToStorage(STORAGE_KEYS.INGREDIENTS, updatedIngredients);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, nextTrxs);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      newMovements.some((m) => m.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);
  };

  const addPrepareTransaction = (
    date: string,
    refNo: string,
    notes: string,
    items: PrepareItemInput[]
  ) => {
    const now = Date.now();
    const trxId = `trx-prep-${now}`;
    const isoDate = createLocalDateTimeIso(date);
    const actualRefNo = refNo || generateRefNo('PREP');
    const newTrx: Transaction = {
      id: trxId,
      type: 'prepare',
      transaction_date: isoDate,
      reference_no: actualRefNo,
      notes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const targetId = String(item.ingredient_id || '').trim().toLowerCase();
      const ingIndex = updatedIngredients.findIndex(
        (i) =>
          String(i.id).trim().toLowerCase() === targetId ||
          String(i.code).trim().toLowerCase() === targetId
      );

      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const realIngId = String(currentIng.id);
        const qty = Number(item.quantity) || 0;
        const currentStock = getIngredientCurrentStock(currentIng, [...newMovements, ...stockMovements]);

        let newStock = currentStock;
        if (item.is_target) {
          // Prepared target (In)
          newStock = currentStock + qty;
        } else {
          // Source raw ingredient (Out)
          newStock = currentStock - qty;
        }

        updatedIngredients[ingIndex] = { ...currentIng, current_stock: newStock };

        newMovements.push({
          id: `mov-${now}-${index}`,
          transaction_id: trxId,
          ingredient_id: realIngId,
          type: item.is_target ? 'in' : 'out',
          quantity: qty,
          balance_after: newStock,
          description: item.is_target
            ? `Hasil Proses Prepare / Konversi (${actualRefNo})`
            : `Pemakaian Bahan Mentah untuk Prepare (${actualRefNo})`,
          created_at: new Date(new Date(isoDate).getTime() + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    saveToStorage(STORAGE_KEYS.INGREDIENTS, updatedIngredients);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, nextTrxs);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      newMovements.some((m) => m.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);
  };

  const checkProductionSufficiency = (menuId: string, portionCount: number): ProductionSufficiencyResult => {
    const { details } = getMenuRecipeDetails(menuId);
    let isSufficient = true;

    const items = details.map((d) => {
      const ing = ingredients.find((i) => i.id === d.ingredient_id || i.code === d.ingredient_id);
      const unit = units.find((u) => u.id === ing?.unit_id);
      const requiredQty = (d.quantity || 0) * portionCount;
      const currentStock = ing ? getIngredientCurrentStock(ing, stockMovements) : 0;
      const isShortage = currentStock < requiredQty;

      if (isShortage) {
        isSufficient = false;
      }

      return {
        ingredient: ing
          ? { ...ing, current_stock: currentStock }
          : ({ name: 'Unknown Ingredient', code: 'N/A', current_stock: 0 } as Ingredient),
        unit,
        requiredQty,
        currentStock,
        isShortage,
        missingQty: isShortage ? requiredQty - currentStock : 0,
      };
    });

    return { isSufficient, items };
  };

  const addProductionTransaction = (
    date: string,
    menuIdOrItems: string | ProductionItemInput[],
    portionCountOrRefNo?: number | string,
    refNoOrNotes?: string,
    notesOrEmpty?: string
  ) => {
    let items: ProductionItemInput[] = [];
    let refNo = '';
    let notes = '';

    if (Array.isArray(menuIdOrItems)) {
      items = menuIdOrItems.filter((i) => i.menu_id && Number(i.portion_count) > 0);
      refNo = (portionCountOrRefNo as string) || '';
      notes = refNoOrNotes || '';
    } else {
      items = [{ menu_id: menuIdOrItems, portion_count: Number(portionCountOrRefNo) || 1 }];
      refNo = (refNoOrNotes as string) || '';
      notes = notesOrEmpty || '';
    }

    if (items.length === 0) {
      return { success: false, message: 'Pilih minimal 1 menu dengan porsi lebih dari 0' };
    }

    const allRequiredMovements: Array<{ ingredient_id: string; requiredQty: number; menuName: string; portionCount: number }> = [];

    for (const item of items) {
      const menu = menus.find((m) => m.id === item.menu_id || m.name === item.menu_id);
      if (!menu) continue;

      const sufficiency = checkProductionSufficiency(item.menu_id, item.portion_count);
      if (sufficiency.items.length === 0) {
        return { success: false, message: `Resep untuk menu "${menu.name}" belum dikonfigurasi` };
      }

      for (const sItem of sufficiency.items) {
        const ingId = String(sItem.ingredient?.id || '').trim();
        if (ingId) {
          allRequiredMovements.push({
            ingredient_id: ingId,
            requiredQty: sItem.requiredQty,
            menuName: menu.name,
            portionCount: item.portion_count,
          });
        }
      }
    }

    if (allRequiredMovements.length === 0) {
      return { success: false, message: 'Tidak ada komposisi resep yang dapat diproses' };
    }

    const now = Date.now();
    const trxId = `trx-prod-${now}`;
    const isoDate = createLocalDateTimeIso(date);
    const actualRefNo = refNo || generateRefNo('PROD');

    const primaryMenuId = items[0]?.menu_id || '';
    const totalPortions = items.reduce((sum, i) => sum + i.portion_count, 0);

    const menuSummaryParts = items.map((item) => {
      const m = menus.find((menu) => menu.id === item.menu_id);
      return `${item.portion_count} porsi ${m ? m.name : 'Menu'}`;
    });
    const defaultMenuSummary = `Terjual ${menuSummaryParts.join(', ')}`;
    const finalNotes = notes ? `${notes} (${defaultMenuSummary})` : defaultMenuSummary;

    const newTrx: Transaction = {
      id: trxId,
      type: 'production',
      transaction_date: isoDate,
      reference_no: actualRefNo,
      menu_id: primaryMenuId,
      portion_count: totalPortions,
      production_items: items.map((i) => ({ menu_id: i.menu_id, portion_count: i.portion_count })),
      notes: finalNotes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    allRequiredMovements.forEach((req, index) => {
      const targetId = req.ingredient_id.toLowerCase();
      const ingIndex = updatedIngredients.findIndex(
        (i) =>
          String(i.id).trim().toLowerCase() === targetId ||
          String(i.code || '').trim().toLowerCase() === targetId
      );

      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const realIngId = String(currentIng.id);
        const currentStock = getIngredientCurrentStock(currentIng, [...newMovements, ...stockMovements]);
        const newStock = currentStock - req.requiredQty;
        updatedIngredients[ingIndex] = { ...currentIng, current_stock: newStock };

        newMovements.push({
          id: `mov-${now}-${index}`,
          transaction_id: trxId,
          ingredient_id: realIngId,
          type: 'out',
          quantity: req.requiredQty,
          balance_after: newStock,
          description: `Penjualan ${req.portionCount} porsi ${req.menuName} (${actualRefNo})`,
          created_at: new Date(new Date(isoDate).getTime() + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    saveToStorage(STORAGE_KEYS.INGREDIENTS, updatedIngredients);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, nextTrxs);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      newMovements.some((m) => m.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);

    return {
      success: true,
      message: `Berhasil mencatat penjualan/produksi ${items.length} menu (${totalPortions} porsi). Stok bahan telah terpotong otomatis!`,
    };
  };

  // Helper to get actual current stock based on running sum and latest balance_after
  const getIngredientCurrentStock = (ing: Ingredient, movements: StockMovement[]): number => {
    if (!ing) return 0;
    const ingId = String(ing.id || '').trim().toLowerCase();
    const ingCode = String(ing.code || '').trim().toLowerCase();

    const isIngMatch = (m: StockMovement) => {
      if (!m || !m.ingredient_id) return false;
      const mId = (typeof m.ingredient_id === 'object' && m.ingredient_id !== null ? String((m.ingredient_id as any).id || '') : String(m.ingredient_id || '')).trim().toLowerCase();
      return mId === ingId || mId === ingCode;
    };

    const ingMovs = movements.filter(isIngMatch);

    if (ingMovs.length > 0) {
      // Sort chronologically ascending
      const sortedMovs = [...ingMovs].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return String(a.id).localeCompare(String(b.id));
      });

      const latest = sortedMovs[sortedMovs.length - 1];
      if (latest && latest.balance_after !== undefined && latest.balance_after !== null && !isNaN(Number(latest.balance_after))) {
        return Number(latest.balance_after);
      }

      let running = 0;
      sortedMovs.forEach((m) => {
        const q = Number(m.quantity) || 0;
        if (m.type === 'in') running += q;
        else if (m.type === 'out') running -= q;
      });
      return running;
    }
    return Number(ing.current_stock) || 0;
  };

  const addAdjustmentTransaction = (
    date: string,
    ingredientIdOrItems: string | AdjustmentItemInput[],
    quantityOrReason?: number | 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    modeOrNotes?: 'plus' | 'minus' | 'set' | string,
    reasonOrEmpty?: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    notesOrEmpty?: string
  ) => {
    let items: AdjustmentItemInput[] = [];
    let reason: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other' = 'Stock Opname';
    let notes = '';

    if (Array.isArray(ingredientIdOrItems)) {
      items = ingredientIdOrItems.filter((i) => i.ingredient_id && !isNaN(Number(i.quantity)) && Number(i.quantity) >= 0);
      reason = (quantityOrReason as any) || 'Stock Opname';
      notes = (modeOrNotes as string) || '';
    } else {
      const ingId = ingredientIdOrItems;
      const qty = Number(quantityOrReason) || 0;
      const mode = (modeOrNotes as 'plus' | 'minus' | 'set') || 'set';
      reason = reasonOrEmpty || 'Stock Opname';
      notes = notesOrEmpty || '';
      items = [{ ingredient_id: ingId, quantity: qty, mode }];
    }

    if (items.length === 0) return;

    const now = Date.now();
    const trxId = `trx-adj-${now}`;
    const refNo = generateRefNo('ADJ');

    const isoDate = createLocalDateTimeIso(date);
    const targetTimestamp = new Date(isoDate).getTime();

    const targetDateYMD = getYYYYMMDD(date);

    const newTrx: Transaction = {
      id: trxId,
      type: 'adjustment',
      transaction_date: isoDate,
      reference_no: refNo,
      notes: notes || `Penyesuaian stok ${items.length} bahan (${reason})`,
      adjustment_reason: reason,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];
    let updatedStockMovements = [...stockMovements];

    const getMovementDate = (m: StockMovement): string => {
      const trx = transactions.find((t) => {
        if (!t) return false;
        if (m.transaction_id && String(t.id).trim().toLowerCase() === String(m.transaction_id).trim().toLowerCase()) {
          return true;
        }
        if (t.reference_no && m.description && String(m.description).toLowerCase().includes(String(t.reference_no).toLowerCase())) {
          return true;
        }
        return false;
      });

      if (trx?.transaction_date) {
        return getYYYYMMDD(trx.transaction_date);
      }
      if (m.created_at) {
        return getYYYYMMDD(m.created_at);
      }
      if (trx?.created_at) {
        return getYYYYMMDD(trx.created_at);
      }
      return getYYYYMMDD(new Date().toISOString());
    };

    items.forEach((item, index) => {
      const targetId = String(item.ingredient_id || '').trim().toLowerCase();
      const ingIndex = updatedIngredients.findIndex(
        (i) => String(i.id).trim().toLowerCase() === targetId || String(i.code || '').trim().toLowerCase() === targetId
      );
      if (ingIndex === -1) return;

      const ing = updatedIngredients[ingIndex];
      const realIngId = String(ing.id);
      const realIngCode = String(ing.code || '').toLowerCase();

      const isIngMatch = (m: StockMovement) => {
        if (!m || !m.ingredient_id) return false;
        const mId = (typeof m.ingredient_id === 'object' && m.ingredient_id !== null ? String((m.ingredient_id as any).id || '') : String(m.ingredient_id || '')).trim().toLowerCase();
        return mId === realIngId.toLowerCase() || mId === realIngCode;
      };

      // 1. Calculate stock balance of this ingredient up to this adjustment's target date
      // Includes all movements prior to targetDate, and movements on targetDate up to this time
      const priorMovs = updatedStockMovements.filter((m) => {
        if (!isIngMatch(m)) return false;
        const mDate = getMovementDate(m);
        if (mDate < targetDateYMD) return true;
        if (mDate === targetDateYMD && new Date(m.created_at).getTime() <= targetTimestamp) return true;
        return false;
      });

      let stockPriorOnDate = 0;
      priorMovs.forEach((m) => {
        const q = Number(m.quantity) || 0;
        if (m.type === 'in') stockPriorOnDate += q;
        else if (m.type === 'out') stockPriorOnDate -= q;
      });

      const qty = Math.max(0, Number(item.quantity) || 0);

      let delta = 0;
      let moveType: 'in' | 'out' = 'out';
      let moveQty = 0;
      let balanceAfterOnDate = 0;

      if (item.mode === 'set') {
        // Stock Opname: Setting physical stock on target date to target qty
        delta = qty - stockPriorOnDate;
        balanceAfterOnDate = qty;
        moveType = delta >= 0 ? 'in' : 'out';
        moveQty = Math.abs(delta);
      } else if (item.mode === 'plus') {
        delta = qty;
        balanceAfterOnDate = stockPriorOnDate + qty;
        moveType = 'in';
        moveQty = qty;
      } else {
        // 'minus'
        delta = -qty;
        balanceAfterOnDate = stockPriorOnDate - qty;
        moveType = 'out';
        moveQty = qty;
      }

      const itemDesc = item.mode === 'set'
        ? `Stock Opname: ${stockPriorOnDate} -> ${balanceAfterOnDate} (${item.item_notes || reason}) (${refNo})`
        : `Penyesuaian Stok (${moveType === 'in' ? '+' : '-'}) Alasan: ${reason} - ${item.item_notes || notes} (${refNo})`;

      const movTimestamp = new Date(targetTimestamp + index * 10).toISOString();
      const newMov: StockMovement = {
        id: `mov-${now}-${index}`,
        transaction_id: trxId,
        ingredient_id: realIngId,
        type: moveType,
        quantity: moveQty,
        balance_after: balanceAfterOnDate,
        description: itemDesc,
        created_at: movTimestamp,
      };
      newMovements.push(newMov);

      // 2. If there are future movements after this date for this ingredient, adjust their balance_after by delta
      if (delta !== 0) {
        updatedStockMovements = updatedStockMovements.map((m) => {
          if (isIngMatch(m)) {
            const mDate = getMovementDate(m);
            if (mDate > targetDateYMD || (mDate === targetDateYMD && new Date(m.created_at).getTime() > targetTimestamp)) {
              return {
                ...m,
                balance_after: (Number(m.balance_after) || 0) + delta,
              };
            }
          }
          return m;
        });
      }

      // 3. Update current live stock of ingredient today
      const currentLive = Number(ing.current_stock) || 0;
      updatedIngredients[ingIndex] = {
        ...ing,
        current_stock: currentLive + delta,
      };
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...updatedStockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    saveToStorage(STORAGE_KEYS.INGREDIENTS, updatedIngredients);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, nextTrxs);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      newMovements.some((m) => m.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);
  };

  const deleteTransaction = async (transactionId: string) => {
    const trxToDelete = transactions.find((t) => String(t.id).trim() === String(transactionId).trim());
    if (!trxToDelete) return;

    // Track deleted transaction ID and reference_no to prevent pullFromSupabase from re-importing it
    deletedTrxIdsRef.current.add(String(transactionId).trim());
    if (trxToDelete.reference_no) {
      deletedTrxIdsRef.current.add(String(trxToDelete.reference_no).trim());
    }

    // Find stock movements associated with this transaction
    const movsToDelete = stockMovements.filter((m) => {
      if (!m) return false;
      if (String(m.transaction_id).trim() === String(transactionId).trim()) return true;
      if (trxToDelete.reference_no && m.description && m.description.includes(trxToDelete.reference_no)) return true;
      return false;
    });

    // Calculate stock reversal deltas ONLY for ingredients in this transaction
    const stockDeltas: Record<string, number> = {};
    const deletedMovTimes: Record<string, number> = {};

    movsToDelete.forEach((m) => {
      if (!m.ingredient_id) return;

      // Find canonical ingredient ID
      const targetIng = ingredients.find((i) =>
        String(i.id).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase() ||
        String(i.code).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase()
      );

      const ingIdKey = targetIng ? String(targetIng.id).trim().toLowerCase() : String(m.ingredient_id).trim().toLowerCase();
      const ingCodeKey = targetIng ? String(targetIng.code || '').trim().toLowerCase() : String(m.ingredient_id).trim().toLowerCase();
      const qty = Number(m.quantity) || 0;

      if (stockDeltas[ingIdKey] === undefined) stockDeltas[ingIdKey] = 0;
      if (stockDeltas[ingCodeKey] === undefined) stockDeltas[ingCodeKey] = 0;

      // 'in' means this transaction added stock -> reversal subtracts stock (-qty)
      // 'out' means this transaction deducted stock -> reversal restores stock (+qty)
      if (m.type === 'in') {
        stockDeltas[ingIdKey] -= qty;
        stockDeltas[ingCodeKey] -= qty;
      } else if (m.type === 'out') {
        stockDeltas[ingIdKey] += qty;
        stockDeltas[ingCodeKey] += qty;
      }

      const movTime = new Date(m.created_at).getTime() || 0;
      if (!deletedMovTimes[ingIdKey] || movTime < deletedMovTimes[ingIdKey]) {
        deletedMovTimes[ingIdKey] = movTime;
      }
    });

    const nextTrxs = transactions.filter((t) => String(t.id).trim() !== String(transactionId).trim());
    let nextMovs = stockMovements.filter((m) => !movsToDelete.some((delM) => String(delM.id) === String(m.id)));

    // Update balance_after for movements occurring AT or AFTER the deleted movement
    nextMovs = nextMovs.map((m) => {
      if (!m.ingredient_id) return m;
      const targetIng = ingredients.find((i) =>
        String(i.id).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase() ||
        String(i.code).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase()
      );
      const ingIdKey = targetIng ? String(targetIng.id).trim().toLowerCase() : String(m.ingredient_id).trim().toLowerCase();
      const delta = stockDeltas[ingIdKey];
      if (delta !== undefined && delta !== 0) {
        const movTime = new Date(m.created_at).getTime() || 0;
        const delTime = deletedMovTimes[ingIdKey] || 0;
        if (movTime >= delTime) {
          const oldBal = Number(m.balance_after) || 0;
          return {
            ...m,
            balance_after: oldBal + delta,
          };
        }
      }
      return m;
    });

    // Calculate updated stock for each ingredient directly by applying reversal delta
    const updatedIngredients = ingredients.map((ing) => {
      const ingIdKey = String(ing.id).trim().toLowerCase();
      const ingCodeKey = String(ing.code || '').trim().toLowerCase();

      const delta = stockDeltas[ingIdKey] ?? stockDeltas[ingCodeKey] ?? 0;
      if (delta !== 0) {
        const currentStock = Number(ing.current_stock) || 0;
        const newStock = currentStock + delta;
        return {
          ...ing,
          current_stock: newStock,
        };
      }
      return ing;
    });

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    // Save locally
    saveToStorage(STORAGE_KEYS.INGREDIENTS, updatedIngredients);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, nextTrxs);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, nextMovs);

    // Delete from Supabase if active & update affected ingredients and movements
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_movements').delete().eq('transaction_id', transactionId);
        try { await supabase.from('stock_moved').delete().eq('transaction_id', transactionId); } catch {}
        if (trxToDelete.reference_no) {
          try { await supabase.from('stock_movements').delete().ilike('description', `%${trxToDelete.reference_no}%`); } catch {}
        }
        await supabase.from('transactions').delete().eq('id', transactionId);

        // Update remaining movements whose balance_after was shifted
        const affectedMovs = nextMovs.filter((m) => {
          const targetIng = ingredients.find((i) =>
            String(i.id).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase() ||
            String(i.code).trim().toLowerCase() === String(m.ingredient_id).trim().toLowerCase()
          );
          const ingIdKey = targetIng ? String(targetIng.id).trim().toLowerCase() : String(m.ingredient_id).trim().toLowerCase();
          return stockDeltas[ingIdKey] !== undefined;
        });

        if (affectedMovs.length > 0) {
          const cleanMovs = affectedMovs.map((m) => ({
            id: String(m.id),
            transaction_id: String(m.transaction_id),
            ingredient_id: String(m.ingredient_id),
            type: m.type,
            quantity: Number(m.quantity) || 0,
            balance_after: Number(m.balance_after) || 0,
            description: String(m.description || ''),
            created_at: m.created_at,
          }));
          await supabase.from('stock_movements').upsert(cleanMovs);
        }

        const changedIngs = updatedIngredients.filter((ing) => {
          const ingIdKey = String(ing.id).trim().toLowerCase();
          const ingCodeKey = String(ing.code || '').trim().toLowerCase();
          return stockDeltas[ingIdKey] !== undefined || stockDeltas[ingCodeKey] !== undefined;
        });

        if (changedIngs.length > 0) {
          const cleanIngs = changedIngs.map((ing) => ({
            id: String(ing.id),
            code: String(ing.code || ''),
            name: String(ing.name || ''),
            category_id: ing.category_id ? String(ing.category_id) : null,
            unit_id: ing.unit_id ? String(ing.unit_id) : null,
            type: ing.type || 'raw',
            min_stock: Number(ing.min_stock) || 0,
            current_stock: Number(ing.current_stock) || 0,
            is_active: ing.is_active !== false,
            cost_per_unit: Number(ing.cost_per_unit) || 0,
          }));
          await supabase.from('ingredients').upsert(cleanIngs);
        }
      } catch (e) {
        console.warn('Error deleting transaction from Supabase:', e);
      }
    }
  };

  const clearAllTransactions = async () => {
    // Track all current transactions as deleted
    transactions.forEach((t) => {
      if (t.id) deletedTrxIdsRef.current.add(String(t.id).trim());
      if (t.reference_no) deletedTrxIdsRef.current.add(String(t.reference_no).trim());
    });

    // TIDAK MENGEMBALIKAN STOK:
    // Stok bahan saat ini tetap pada posisi saat ini, riwayat transaksi & mutasi dibersihkan.
    setTransactions([]);
    setStockMovements([]);

    saveToStorage(STORAGE_KEYS.TRANSACTIONS, []);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_movements').delete().neq('id', '0');
        try { await supabase.from('stock_moved').delete().neq('id', '0'); } catch {}
        await supabase.from('transactions').delete().neq('id', '0');
      } catch (e) {
        console.warn('Error clearing Supabase transactions:', e);
      }
    }
  };

  const reconcileAllHistoricalData = async (): Promise<{ success: boolean; repairedCount: number }> => {
    const {
      reconciledTransactions,
      reconciledMovements,
      reconciledIngredients,
      repairedCount,
    } = reconcileHistoricalTransactionsAndMovements(
      transactions,
      stockMovements,
      ingredients,
      recipeDetails,
      recipes,
      menus,
      prepareFormulas
    );

    setTransactions(reconciledTransactions);
    setStockMovements(reconciledMovements);
    setIngredients(reconciledIngredients);

    saveToStorage(STORAGE_KEYS.TRANSACTIONS, reconciledTransactions);
    saveToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, reconciledMovements);
    saveToStorage(STORAGE_KEYS.INGREDIENTS, reconciledIngredients);

    // Sync to Supabase in background
    syncDataToSupabase(reconciledIngredients, undefined, reconciledMovements, reconciledTransactions, reconciledMovements);

    return { success: true, repairedCount };
  };

  // Daily Stock Report Generator
  const getDailyStockReport = (dateFilter: string): DailyStockRow[] => {
    const isAllDates = !dateFilter || dateFilter === 'all';
    const targetDate = isAllDates ? 'all' : getYYYYMMDD(dateFilter);

    return ingredients.map((ing) => {
      const unit = units.find((u) => u.id === ing.unit_id) || ({ abbreviation: '-' } as Unit);
      const cat = categories.find((c) => c.id === ing.category_id) || ({ name: '-' } as Category);

      const liveStock = getIngredientCurrentStock(ing, stockMovements);

      const ingId = String(ing.id || '').trim().toLowerCase();
      const ingCode = String(ing.code || '').trim().toLowerCase();

      const isIngMatch = (m: StockMovement) => {
        if (!m || !m.ingredient_id) return false;
        const mIngId = (typeof m.ingredient_id === 'object' && m.ingredient_id !== null ? String((m.ingredient_id as any).id || '') : String(m.ingredient_id || '')).trim().toLowerCase();
        return mIngId === ingId || mIngId === ingCode;
      };

      const getMovementDate = (m: StockMovement): string => {
        const trx = transactions.find((t) => {
          if (!t) return false;
          if (m.transaction_id && String(t.id).trim().toLowerCase() === String(m.transaction_id).trim().toLowerCase()) {
            return true;
          }
          if (t.reference_no && m.description && String(m.description).toLowerCase().includes(String(t.reference_no).toLowerCase())) {
            return true;
          }
          return false;
        });

        if (trx?.transaction_date) {
          return getYYYYMMDD(trx.transaction_date);
        }
        if (m.created_at) {
          return getYYYYMMDD(m.created_at);
        }
        if (trx?.created_at) {
          return getYYYYMMDD(trx.created_at);
        }
        return getYYYYMMDD(new Date().toISOString());
      };

      // All movements for this ingredient sorted chronologically
      const allIngMovs = stockMovements.filter(isIngMatch);
      const sortedIngMovs = [...allIngMovs].sort((a, b) => {
        const dateA = getMovementDate(a);
        const dateB = getMovementDate(b);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return String(a.id).localeCompare(String(b.id));
      });

      // Calculate baseline initial stock before all movements started
      let baselineInitialStock = liveStock;
      if (sortedIngMovs.length > 0) {
        const firstMov = sortedIngMovs[0];
        if (firstMov.balance_after !== undefined && firstMov.balance_after !== null && !isNaN(Number(firstMov.balance_after))) {
          const fQty = Number(firstMov.quantity) || 0;
          const fType = String(firstMov.type || '').toLowerCase();
          baselineInitialStock = fType === 'in' ? Number(firstMov.balance_after) - fQty : Number(firstMov.balance_after) + fQty;
        } else {
          let totalNet = 0;
          sortedIngMovs.forEach((m) => {
            const q = Number(m.quantity) || 0;
            if (String(m.type).toLowerCase() === 'in') totalNet += q;
            else totalNet -= q;
          });
          baselineInitialStock = liveStock - totalNet;
        }
      }

      // Movements on targetDate or all dates
      const movementsToday = sortedIngMovs.filter((m) => {
        if (isAllDates) return true;
        const mDate = getMovementDate(m);
        return mDate === targetDate;
      });

      // Movements created BEFORE targetDate
      const movementsBefore = isAllDates
        ? []
        : sortedIngMovs.filter((m) => {
            const mDate = getMovementDate(m);
            return mDate < targetDate;
          });

      let in_purchase = 0;
      let in_prepare = 0;
      let out_prepare = 0;
      let out_production = 0;
      let in_adjustment = 0;
      let out_adjustment = 0;

      movementsToday.forEach((m) => {
        const trx = transactions.find((t) => {
          if (!t) return false;
          if (m.transaction_id && String(t.id).trim().toLowerCase() === String(m.transaction_id).trim().toLowerCase()) {
            return true;
          }
          if (t.reference_no && m.description && String(m.description).toLowerCase().includes(String(t.reference_no).toLowerCase())) {
            return true;
          }
          return false;
        });

        const descLower = m.description ? String(m.description).toLowerCase() : '';
        const trxType = trx?.type ? String(trx.type).toLowerCase() : '';
        const mType = String(m.type || '').trim().toLowerCase();
        const qty = Number(m.quantity) || 0;

        const isPurchase = trxType === 'purchase' || descLower.includes('pembelian') || descLower.includes('beli') || descLower.includes('pur');
        const isPrepare = trxType === 'prepare' || descLower.includes('prepare') || descLower.includes('konversi') || descLower.includes('prep');
        const isProduction = trxType === 'production' || descLower.includes('produksi') || descLower.includes('penjualan') || descLower.includes('jual') || descLower.includes('porsi') || descLower.includes('prod');
        const isAdj = trxType === 'adjustment' || descLower.includes('penyesuaian') || descLower.includes('opname') || descLower.includes('init') || descLower.includes('adj') || descLower.includes('loss') || descLower.includes('damage') || descLower.includes('expired');

        if (isPurchase) {
          if (mType === 'in') in_purchase += qty;
        } else if (isPrepare) {
          if (mType === 'in') in_prepare += qty;
          if (mType === 'out') out_prepare += qty;
        } else if (isProduction) {
          if (mType === 'out') out_production += qty;
        } else if (isAdj) {
          if (mType === 'in') in_adjustment += qty;
          if (mType === 'out') out_adjustment += qty;
        } else {
          if (mType === 'in') in_adjustment += qty;
          if (mType === 'out') out_adjustment += qty;
        }
      });

      // Total changes on targetDate
      const totalTodayIn = in_purchase + in_prepare + in_adjustment;
      const totalTodayOut = out_prepare + out_production + out_adjustment;

      // Initial stock at the beginning of targetDate:
      // Exactly equals the final stock of the previous day (or baselineInitialStock if no previous movements)
      let initial_stock = 0;
      if (isAllDates) {
        // In all dates mode, initial stock is baseline stock before any movements
        initial_stock = Math.max(0, baselineInitialStock);
      } else if (movementsBefore.length > 0) {
        const lastBefore = movementsBefore[movementsBefore.length - 1];
        if (lastBefore.balance_after !== undefined && lastBefore.balance_after !== null && !isNaN(Number(lastBefore.balance_after))) {
          initial_stock = Number(lastBefore.balance_after);
        } else {
          let runningStock = baselineInitialStock;
          movementsBefore.forEach((m) => {
            const q = Number(m.quantity) || 0;
            if (String(m.type).toLowerCase() === 'in') runningStock += q;
            else runningStock -= q;
          });
          initial_stock = runningStock;
        }
      } else {
        initial_stock = Math.max(0, baselineInitialStock);
      }

      // Stock at the end of targetDate:
      // Exactly equals initial_stock + total today in - total today out (carries over seamlessly)
      const final_stock = isAllDates ? liveStock : initial_stock + totalTodayIn - totalTodayOut;

      return {
        ingredient: { ...ing, current_stock: liveStock },
        unit,
        category: cat,
        initial_stock,
        in_purchase,
        in_prepare,
        out_prepare,
        out_production,
        in_adjustment,
        out_adjustment,
        final_stock,
      };
    });
  };

  const getIngredientLedger = (ingredientId: string): StockMovement[] => {
    const targetIng = ingredients.find(
      (i) =>
        String(i.id).toLowerCase() === String(ingredientId).toLowerCase() ||
        String(i.code).toLowerCase() === String(ingredientId).toLowerCase()
    );
    const targetId = String(targetIng?.id || ingredientId).toLowerCase();
    const targetCode = String(targetIng?.code || '').toLowerCase();

    return stockMovements
      .filter((m) => {
        if (!m || !m.ingredient_id) return false;
        const mIngId = (typeof m.ingredient_id === 'object' && m.ingredient_id !== null ? String((m.ingredient_id as any).id || '') : String(m.ingredient_id || '')).trim().toLowerCase();
        return mIngId === targetId || mIngId === targetCode;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setUnits(INITIAL_UNITS);
    setCategories(INITIAL_CATEGORIES);
    setSuppliers(INITIAL_SUPPLIERS);
    setIngredients(INITIAL_INGREDIENTS);
    setMenus(INITIAL_MENUS);
    setRecipes(INITIAL_RECIPES);
    setRecipeDetails(INITIAL_RECIPE_DETAILS);
    setTransactions(INITIAL_TRANSACTIONS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    deletedTrxIdsRef.current.clear();
    deletedIngIdsRef.current.clear();
    localStorage.clear();
  };

  const generateSupabaseSQL = (): string => {
    const unitInserts = units
      .map(
        (u) =>
          `  ('${u.id.replace(/'/g, "''")}', '${u.name.replace(/'/g, "''")}', '${u.abbreviation.replace(
            /'/g,
            "''"
          )}')`
      )
      .join(',\n');

    const categoryInserts = categories
      .map((c) => `  ('${c.id.replace(/'/g, "''")}', '${c.name.replace(/'/g, "''")}')`)
      .join(',\n');

    const ingredientInserts = ingredients
      .map(
        (ing) =>
          `  ('${ing.id.replace(/'/g, "''")}', '${ing.code.replace(/'/g, "''")}', '${ing.name.replace(
            /'/g,
            "''"
          )}', ${ing.category_id ? `'${ing.category_id}'` : 'NULL'}, ${
            ing.unit_id ? `'${ing.unit_id}'` : 'NULL'
          }, '${ing.type}', ${ing.min_stock || 0}, ${ing.current_stock || 0}, ${
            ing.is_active ? 'TRUE' : 'FALSE'
          }, ${ing.cost_per_unit || 0}, ${ing.cost_per_unit || 0})`
      )
      .join(',\n');

    const menuInserts = menus
      .map(
        (m) =>
          `  ('${m.id.replace(/'/g, "''")}', '${m.name.replace(/'/g, "''")}', '${m.category.replace(
            /'/g,
            "''"
          )}', ${m.price || 0}, ${m.is_active ? 'TRUE' : 'FALSE'})`
      )
      .join(',\n');

    const recipeInserts = recipes
      .map(
        (r) =>
          `  ('${r.id.replace(/'/g, "''")}', '${r.menu_id.replace(/'/g, "''")}', ${r.version || 1}, ${
            r.is_active ? 'TRUE' : 'FALSE'
          }, ${r.notes ? `'${r.notes.replace(/'/g, "''")}'` : 'NULL'})`
      )
      .join(',\n');

    const recipeDetailInserts = recipeDetails
      .map(
        (rd) =>
          `  ('${rd.id.replace(/'/g, "''")}', '${rd.recipe_id.replace(
            /'/g,
            "''"
          )}', '${rd.ingredient_id.replace(/'/g, "''")}', ${rd.quantity || 0})`
      )
      .join(',\n');

    return `-- MECAMOCHA INVENTORY SYSTEM - SUPABASE DATABASE MIGRATION SCRIPT
-- Execute this script in your Supabase SQL Editor

-- Disable RLS to allow direct anonymous REST sync
ALTER TABLE IF EXISTS public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements DISABLE ROW LEVEL SECURITY;

-- 1. Create Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Ingredients Table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('raw', 'prepared')),
  min_stock DOUBLE PRECISION DEFAULT 0,
  current_stock DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  cost_per_unit DOUBLE PRECISION DEFAULT 0,
  cogs_per_unit DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS cost_per_unit DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS cogs_per_unit DOUBLE PRECISION DEFAULT 0;

-- 5. Create Menus Table
CREATE TABLE IF NOT EXISTS public.menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  active_recipe_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS active_recipe_version INT DEFAULT 1;

-- 6. Create Recipes Table
CREATE TABLE IF NOT EXISTS public.recipes (
  id TEXT PRIMARY KEY,
  menu_id TEXT REFERENCES public.menus(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Recipe Details Table
CREATE TABLE IF NOT EXISTS public.recipe_details (
  id TEXT PRIMARY KEY,
  recipe_id TEXT REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- 8. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'prepare', 'production', 'adjustment')),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_no TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_by TEXT,
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
  menu_id TEXT REFERENCES public.menus(id) ON DELETE SET NULL,
  portion_count INT,
  adjustment_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Stock Movements Ledger Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  transaction_id TEXT REFERENCES public.transactions(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES public.ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity DOUBLE PRECISION NOT NULL,
  balance_after DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Supabase Trigger to Auto-Update current_stock on New Stock Movement Insert
CREATE OR REPLACE FUNCTION update_ingredient_current_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE public.ingredients
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.ingredient_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE public.ingredients
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.ingredient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stock ON public.stock_movements;
CREATE TRIGGER trg_update_stock
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_ingredient_current_stock();

-- =========================================================================
-- SEED DATA INSERTS (UNITS, CATEGORIES, INGREDIENTS, MENUS, RECIPES, DETAILS)
-- =========================================================================
INSERT INTO public.units (id, name, abbreviation) VALUES
${unitInserts}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, abbreviation = EXCLUDED.abbreviation;

INSERT INTO public.categories (id, name) VALUES
${categoryInserts}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.ingredients (id, code, name, category_id, unit_id, type, min_stock, current_stock, is_active, cost_per_unit, cogs_per_unit) VALUES
${ingredientInserts}
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  unit_id = EXCLUDED.unit_id,
  type = EXCLUDED.type,
  min_stock = EXCLUDED.min_stock,
  is_active = EXCLUDED.is_active,
  cost_per_unit = EXCLUDED.cost_per_unit,
  cogs_per_unit = EXCLUDED.cogs_per_unit;

${menuInserts ? `INSERT INTO public.menus (id, name, category, price, is_active) VALUES\n${menuInserts}\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price, is_active = EXCLUDED.is_active;\n` : ''}
${recipeInserts ? `INSERT INTO public.recipes (id, menu_id, version, is_active, notes) VALUES\n${recipeInserts}\nON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, is_active = EXCLUDED.is_active, notes = EXCLUDED.notes;\n` : ''}
${recipeDetailInserts ? `INSERT INTO public.recipe_details (id, recipe_id, ingredient_id, quantity) VALUES\n${recipeDetailInserts}\nON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity;\n` : ''}`;
  };

  return (
    <InventoryContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        addUser,
        deleteUser,
        isSuperAdmin,

        units,
        addUnit,
        updateUnit,
        deleteUnit,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,

        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,

        ingredients,
        addIngredient,
        bulkAddIngredients,
        updateIngredient,
        deleteIngredient,

        menus,
        addMenu,
        updateMenu,
        deleteMenu,

        recipes,
        recipeDetails,
        addRecipeVersion,
        setActiveRecipeVersion,
        getMenuRecipeDetails,
        getPrepareFormula,
        savePrepareFormula,

        transactions,
        stockMovements,
        addPurchaseTransaction,
        addPrepareTransaction,
        checkProductionSufficiency,
        addProductionTransaction,
        addAdjustmentTransaction,
        deleteTransaction,
        clearAllTransactions,

        isSyncing,
        lastSyncedAt,
        supabaseError,
        pushAllToSupabase,
        pullFromSupabase,

        getDailyStockReport,
        getIngredientLedger,

        reconcileAllHistoricalData,

        resetToDefaultData,
        generateSupabaseSQL,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
