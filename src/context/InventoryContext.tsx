import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { generateRefNo } from '../utils/formatters';
import { getSupabase } from '../lib/supabase';

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
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;

  menus: Menu[];
  addMenu: (menu: Omit<Menu, 'id'>) => void;
  updateMenu: (id: string, menu: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;

  // Recipes
  recipes: Recipe[];
  recipeDetails: RecipeDetail[];
  addRecipeVersion: (menuId: string, notes: string, details: Array<{ ingredient_id: string; quantity: number }>) => void;
  setActiveRecipeVersion: (menuId: string, version: number) => void;
  getMenuRecipeDetails: (menuId: string, version?: number) => { recipe?: Recipe; details: Array<RecipeDetail & { ingredient?: Ingredient; unit?: Unit }> };

  // Transactions & Stock Movements
  transactions: Transaction[];
  stockMovements: StockMovement[];
  
  addPurchaseTransaction: (date: string, supplierId: string, refNo: string, notes: string, items: PurchaseItemInput[]) => void;
  addPrepareTransaction: (date: string, refNo: string, notes: string, items: PrepareItemInput[]) => void;
  
  checkProductionSufficiency: (menuId: string, portionCount: number) => ProductionSufficiencyResult;
  addProductionTransaction: (date: string, menuId: string, portionCount: number, refNo: string, notes: string) => { success: boolean; message: string };
  
  addAdjustmentTransaction: (date: string, ingredientId: string, quantity: number, mode: 'plus' | 'minus' | 'set', reason: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other', notes: string) => void;

  // Sync & Supabase
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  supabaseError: string | null;
  pushAllToSupabase: () => Promise<boolean>;
  pullFromSupabase: () => Promise<void>;

  // Reports & Ledger
  getDailyStockReport: (dateFilter: string) => DailyStockRow[];
  getIngredientLedger: (ingredientId: string) => StockMovement[];

  // Utility
  resetToDefaultData: () => void;
  generateSupabaseSQL: () => string;
}

const STORAGE_KEYS = {
  USERS: 'mecamocha_users_v2',
  CURRENT_USER: 'mecamocha_current_user_v2',
  UNITS: 'mecamocha_units_v2',
  CATEGORIES: 'mecamocha_categories_v2',
  SUPPLIERS: 'mecamocha_suppliers_v2',
  INGREDIENTS: 'mecamocha_ingredients_v2',
  MENUS: 'mecamocha_menus_v2',
  RECIPES: 'mecamocha_recipes_v2',
  RECIPE_DETAILS: 'mecamocha_recipe_details_v2',
  TRANSACTIONS: 'mecamocha_transactions_v2',
  STOCK_MOVEMENTS: 'mecamocha_stock_movements_v2',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local Storage Helper
  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      const parsed = JSON.parse(item);
      // Fallback if empty array for core transactions/movements/ingredients
      if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
        return fallback;
      }
      // Fallback if legacy ingredients list with < 50 items
      if (key === STORAGE_KEYS.INGREDIENTS && Array.isArray(parsed) && parsed.length < 50) {
        return fallback;
      }
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
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => loadFromStorage(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS));
  const [menus, setMenus] = useState<Menu[]>(() => loadFromStorage(STORAGE_KEYS.MENUS, INITIAL_MENUS));
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadFromStorage(STORAGE_KEYS.RECIPES, INITIAL_RECIPES));
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>(() => sanitizeRecipeDetails(loadFromStorage(STORAGE_KEYS.RECIPE_DETAILS, INITIAL_RECIPE_DETAILS)));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadFromStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS));

  // Helper to merge local state and remote Supabase state without wiping un-synced items
  const mergeByField = <T,>(localList: T[], remoteList: T[], key: keyof T): T[] => {
    const map = new Map<any, T>();
    localList.forEach((item) => {
      if (item && item[key]) map.set(item[key], item);
    });
    remoteList.forEach((item) => {
      if (item && item[key]) map.set(item[key], item);
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

      // 1. Sync ingredients
      if (changedIngredients && changedIngredients.length > 0) {
        const cleanIngredients = changedIngredients.map((ing) => ({
          id: String(ing.id),
          code: String(ing.code || ''),
          name: String(ing.name || ''),
          category_id: ing.category_id && categories.some((c) => c.id === ing.category_id) ? String(ing.category_id) : null,
          unit_id: ing.unit_id && units.some((u) => u.id === ing.unit_id) ? String(ing.unit_id) : null,
          type: ing.type || 'raw',
          min_stock: Number(ing.min_stock) || 0,
          current_stock: Number(ing.current_stock) || 0,
          is_active: ing.is_active ?? true,
          cost_per_unit: Number(ing.cost_per_unit) || 0,
        }));

        const { error: ingErr } = await supabase.from('ingredients').upsert(cleanIngredients);
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

        const { error: trxErr } = await supabase.from('transactions').upsert(cleanTrxs);
        if (trxErr) {
          console.error('Supabase transaction upsert error:', trxErr);
          syncErr = `Gagal sync transaksi: ${trxErr.message}`;
        }
      }

      // 3. Sync stock movements (include newMovements and all existing movements)
      const allMovs = overrideAllMovs || (newMovements && newMovements.length > 0
        ? [...newMovements, ...stockMovements.filter((m) => !newMovements.some((nm) => nm.id === m.id))]
        : stockMovements);

      if (allMovs.length > 0) {
        const cleanMovements = allMovs.map((m) => {
          const foundIng = ingredients.find(
            (i) =>
              i.id === m.ingredient_id ||
              String(i.code).toLowerCase() === String(m.ingredient_id).toLowerCase()
          );
          const ingId = foundIng ? String(foundIng.id) : String(m.ingredient_id);
          const validTrx = m.transaction_id && allTrxs.some((t) => t.id === m.transaction_id);

          return {
            id: String(m.id),
            transaction_id: validTrx ? String(m.transaction_id) : null,
            ingredient_id: ingId,
            type: String(m.type),
            quantity: Number(m.quantity) || 0,
            balance_after: m.balance_after !== undefined && m.balance_after !== null ? Number(m.balance_after) : null,
            description: m.description || null,
            created_at: m.created_at || new Date().toISOString(),
          };
        });

        const { error: movErr } = await supabase.from('stock_movements').upsert(cleanMovements);
        if (movErr) {
          console.error('Supabase movements upsert error:', movErr);
          syncErr = `Gagal sync mutasi: ${movErr.message}`;
        }
      }

      if (syncErr) {
        setSupabaseError(syncErr);
      } else {
        setLastSyncedAt(new Date());
        setSupabaseError(null);
      }
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
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
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

      if (sbUnits && sbUnits.length > 0) setUnits((prev) => mergeByField(prev, sbUnits, 'id'));
      if (sbCategories && sbCategories.length > 0) setCategories((prev) => mergeByField(prev, sbCategories, 'id'));
      if (sbSuppliers && sbSuppliers.length > 0) setSuppliers((prev) => mergeByField(prev, sbSuppliers, 'id'));
      if (sbMenus && sbMenus.length > 0) setMenus((prev) => mergeByField(prev, sbMenus, 'id'));
      if (sbRecipes && sbRecipes.length > 0) setRecipes((prev) => mergeByField(prev, sbRecipes, 'id'));
      if (recipeDetailsData && recipeDetailsData.length > 0) {
        setRecipeDetails((prev) => {
          const merged = sanitizeRecipeDetails(mergeByField(prev, recipeDetailsData, 'id'));
          const recipeGroups = new Map<string, RecipeDetail[]>();
          for (const rd of merged) {
            if (rd && rd.recipe_id) {
              const list = recipeGroups.get(rd.recipe_id) || [];
              list.push(rd);
              recipeGroups.set(rd.recipe_id, list);
            }
          }

          const cleanedList: RecipeDetail[] = [];
          for (const [, group] of recipeGroups.entries()) {
            const userSaved = group.filter((rd) => rd.id && rd.id.startsWith('rd-rec-'));
            const targetGroup = userSaved.length > 0 ? userSaved : group;
            const ingMap = new Map<string, RecipeDetail>();
            for (const item of targetGroup) {
              if (item && item.ingredient_id) {
                ingMap.set(item.ingredient_id, item);
              }
            }
            cleanedList.push(...Array.from(ingMap.values()));
          }
          return cleanedList;
        });
      }

      const cleanMovements = (stockMovementsData || []).map((m) => ({
        ...m,
        id: String(m.id),
        transaction_id: m.transaction_id ? String(m.transaction_id) : undefined,
        ingredient_id: String(m.ingredient_id),
        type: String(m.type) as 'in' | 'out',
        quantity: Number(m.quantity) || 0,
        balance_after: m.balance_after !== undefined && m.balance_after !== null ? Number(m.balance_after) : undefined,
        description: m.description || '',
        created_at: m.created_at || new Date().toISOString(),
      }));

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

      const cleanIngredients = (sbIngredients || []).map((ing) => ({
        ...ing,
        id: String(ing.id),
        code: String(ing.code || ''),
        name: String(ing.name || ''),
        current_stock: Number(ing.current_stock) || 0,
        min_stock: Number(ing.min_stock) || 0,
        cost_per_unit: Number(ing.cost_per_unit) || 0,
      }));

      // Safely merge transactions so local un-synced transactions are preserved
      setTransactions((prev) =>
        mergeByField(prev, cleanTransactions, 'id').sort((a, b) => {
          const timeA = new Date(a.created_at).getTime() || 0;
          const timeB = new Date(b.created_at).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id).localeCompare(String(a.id));
        })
      );

      // Safely merge stock movements & sync ingredients current_stock live
      setStockMovements((prev) => {
        const mergedMovements = mergeByField(prev, cleanMovements, 'id').sort((a, b) => {
          const timeA = new Date(a.created_at).getTime() || 0;
          const timeB = new Date(b.created_at).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id).localeCompare(String(a.id));
        });

        setIngredients((prevIngs) => {
          const mergedIngs = mergeByField(prevIngs, cleanIngredients, 'id').map((ing) => ({
            ...ing,
            current_stock: getIngredientCurrentStock(ing, mergedMovements),
          }));
          return mergedIngs;
        });

        return mergedMovements;
      });

      // Automatically push all data to Supabase if Supabase transactions are empty
      if (!sbTransactions || sbTransactions.length === 0) {
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
      const refResults = await Promise.all([
        supabase.from('units').upsert(cleanUnits),
        supabase.from('categories').upsert(cleanCategories),
        supabase.from('suppliers').upsert(cleanSuppliers),
      ]);
      const refErr = refResults.find((r) => r.error)?.error;
      if (refErr) {
        console.warn('Push reference tables warning:', refErr);
        const isRls = refErr.message?.toLowerCase().includes('security') || refErr.message?.toLowerCase().includes('policy') || refErr.code === '42501';
        setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS). Klik "Fix Supabase" di kanan atas.' : (refErr.message || 'Gagal push kategori/satuan'));
        return false;
      }

      // Step 2: Push ingredients and menus
      const cleanIngs = ingredients.map((ing) => ({
        id: String(ing.id),
        code: String(ing.code || ''),
        name: String(ing.name || ''),
        category_id: ing.category_id && categories.some((c) => c.id === ing.category_id) ? String(ing.category_id) : null,
        unit_id: ing.unit_id && units.some((u) => u.id === ing.unit_id) ? String(ing.unit_id) : null,
        type: ing.type || 'raw',
        min_stock: Number(ing.min_stock) || 0,
        current_stock: getIngredientCurrentStock(ing, stockMovements),
        is_active: ing.is_active ?? true,
        cost_per_unit: Number(ing.cost_per_unit) || 0,
      }));

      const cleanMenus = menus.map((m) => {
        const catObj = categories.find((c) => c.id === m.category_id);
        const catName = m.category || catObj?.name || 'Umum';
        return {
          id: String(m.id),
          name: String(m.name),
          category: String(catName),
          price: Number(m.price) || 0,
          is_active: m.is_active ?? true,
        };
      });

      const cleanRecipes = recipes
        .filter((r) => menus.some((m) => m.id === r.menu_id))
        .map((r) => ({
          id: String(r.id),
          menu_id: String(r.menu_id),
          version: Number(r.version) || 1,
          is_active: r.is_active ?? true,
          notes: r.notes || null,
          created_at: r.created_at || new Date().toISOString(),
        }));

      const cleanRecipeDetails = recipeDetails
        .filter((rd) => ingredients.some((i) => i.id === rd.ingredient_id))
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
        await supabase.from('recipe_items').upsert(cleanRecipeDetails).catch(() => {});
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
          balance_after: m.balance_after !== undefined && m.balance_after !== null ? Number(m.balance_after) : null,
          description: m.description || null,
          created_at: m.created_at || new Date().toISOString(),
        };
      });

      if (cleanTrxs.length > 0) {
        const { error: trxErr } = await supabase.from('transactions').upsert(cleanTrxs);
        if (trxErr) {
          console.warn('Push transactions warning:', trxErr);
          const isRls = trxErr.message?.toLowerCase().includes('security') || trxErr.message?.toLowerCase().includes('policy') || trxErr.code === '42501';
          setSupabaseError(isRls ? 'Akses Simpan Supabase diblokir (RLS Policy).' : (trxErr.message || 'Gagal push transaksi'));
          return false;
        }
      }

      if (cleanMovs.length > 0) {
        let { error: movErr } = await supabase.from('stock_movements').upsert(cleanMovs);
        await supabase.from('stock_moved').upsert(cleanMovs).catch(() => {});
        if (movErr && movErr.message?.includes('does not exist')) {
          const res = await supabase.from('stock_moved').upsert(cleanMovs);
          movErr = res.error;
        }
        if (movErr) {
          console.warn('Push stock movements warning:', movErr);
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

  // Auto Sync on Mount & Periodic Polling for Multi-Device Consistency
  useEffect(() => {
    // Pull from Supabase directly on startup so web app matches Supabase
    pullFromSupabase();

    // Poll every 12 seconds to ensure changes on other devices sync automatically
    const interval = setInterval(() => {
      pullFromSupabase();
    }, 12000);

    return () => clearInterval(interval);
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
    setUnits((prev) => [...prev, newUnit]);
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
    setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
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
    setUnits((prev) => prev.filter((u) => u.id !== id));
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
    setCategories((prev) => [...prev, newCat]);
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
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
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
    setCategories((prev) => prev.filter((c) => c.id !== id));
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
    setSuppliers((prev) => [...prev, newSup]);
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
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
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
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
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
      category_id: ingData.category_id,
      unit_id: ingData.unit_id,
      type: ingData.type,
      min_stock: ingData.min_stock,
      current_stock: initialStock,
      is_active: ingData.is_active ?? true,
      cost_per_unit: ingData.cost_per_unit || 0,
    };

    setIngredients((prev) => [...prev, newIng]);

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

  const updateIngredient = (id: string, ing: Partial<Ingredient>) => {
    let updatedItem: Ingredient | undefined;
    setIngredients((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...ing };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      syncDataToSupabase([updatedItem]);
    }
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
    try {
      const supabase = getSupabase();
      if (supabase) supabase.from('ingredients').delete().eq('id', id);
    } catch (e) {
      console.warn(e);
    }
  };

  const addMenu = async (menuData: Omit<Menu, 'id'>) => {
    const newMenu: Menu = {
      id: `m-${Date.now()}`,
      ...menuData,
      is_active: menuData.is_active ?? true,
      active_recipe_version: 1,
    };
    const defaultRec: Recipe = {
      id: `rec-${Date.now()}`,
      menu_id: newMenu.id,
      version: 1,
      is_active: true,
      notes: 'Resep Versi 1 (Awal)',
      created_at: new Date().toISOString(),
    };
    setMenus((prev) => [...prev, newMenu]);
    setRecipes((prev) => [...prev, defaultRec]);

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
    let updatedMenuObj: Menu | undefined;
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          updatedMenuObj = { ...m, ...menu };
          return updatedMenuObj;
        }
        return m;
      })
    );
    try {
      const supabase = getSupabase();
      if (supabase && updatedMenuObj) {
        let { error: mErr } = await supabase.from('menus').upsert([{
          id: String(updatedMenuObj.id),
          name: String(updatedMenuObj.name),
          category: String(updatedMenuObj.category || 'Umum'),
          price: Number(updatedMenuObj.price) || 0,
          is_active: updatedMenuObj.is_active ?? true,
        }]);
        if (mErr) {
          await supabase.from('menus').upsert([{
            id: String(updatedMenuObj.id),
            name: String(updatedMenuObj.name),
            category: String(updatedMenuObj.category || 'Umum'),
            price: Number(updatedMenuObj.price) || 0,
          }]);
        }
      }
    } catch (e) {
      console.warn('Error updating menu in Supabase:', e);
    }
  };

  const deleteMenu = async (id: string) => {
    const relatedRecipes = recipes.filter((r) => r.menu_id === id);
    const relatedRecipeIds = relatedRecipes.map((r) => r.id);

    setMenus((prev) => prev.filter((m) => m.id !== id));
    setRecipes((prev) => prev.filter((r) => r.menu_id !== id));
    setRecipeDetails((prev) => prev.filter((rd) => !relatedRecipeIds.includes(rd.recipe_id)));

    try {
      const supabase = getSupabase();
      if (supabase) {
        // Delete recipe details first, then recipes, then menu
        for (const recId of relatedRecipeIds) {
          const { error: rdErr } = await supabase.from('recipe_details').delete().eq('recipe_id', recId);
          if (rdErr && rdErr.message?.includes('does not exist')) {
            await supabase.from('recipe_items').delete().eq('recipe_id', recId);
          }
        }
        await supabase.from('recipes').delete().eq('menu_id', id);
        await supabase.from('menus').delete().eq('id', id);
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
    setRecipes((prev) => [
      ...prev.filter((r) => r.menu_id !== menuId && r.id !== recipeId),
      recipeObj,
    ]);

    // Build set of all recipe IDs associated with this menu
    const possibleRecipeIds = new Set<string>([
      recipeId,
      `rec-${menuId}`,
      `rec-${menuId.replace('-', '')}`,
      menuId,
    ]);
    recipes.filter((r) => r.menu_id === menuId).forEach((r) => possibleRecipeIds.add(r.id));

    // Replace all existing details for this recipe/menu with sanitized new details
    setRecipeDetails((prev) =>
      sanitizeRecipeDetails([
        ...prev.filter(
          (rd) =>
            !rd ||
            !rd.recipe_id ||
            (!possibleRecipeIds.has(rd.recipe_id) &&
              !rd.id.includes(menuId) &&
              !rd.id.includes(recipeId))
        ),
        ...newDetails,
      ])
    );

    setMenus((prev) =>
      prev.map((m) => (m.id === menuId ? { ...m, active_recipe_version: recipeVersion } : m))
    );

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
        await supabase.from('recipe_details').delete().eq('recipe_id', recipeId).catch(() => {});
        await supabase.from('recipe_items').delete().eq('recipe_id', recipeId).catch(() => {});

        // Upsert new details to BOTH recipe_details AND recipe_items
        const cleanDetails = newDetails.map((rd) => ({
          id: String(rd.id),
          recipe_id: String(rd.recipe_id),
          ingredient_id: String(rd.ingredient_id),
          quantity: Number(rd.quantity) || 0,
        }));

        await supabase.from('recipe_details').upsert(cleanDetails).catch(() => {});
        await supabase.from('recipe_items').upsert(cleanDetails).catch(() => {});
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
      recipe = {
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

    const rawDetails = recipeDetails.filter((rd) => rd && rd.recipe_id && possibleRecipeIds.has(rd.recipe_id));

    const userSaved = rawDetails.filter((rd) => rd.id && (rd.id.startsWith('rd-rec-') || rd.id.startsWith(`rd-${recipe.id}`)));
    const targetDetails = userSaved.length > 0 ? userSaved : rawDetails;

    const uniqueDetailsMap = new Map<string, RecipeDetail>();
    for (const rd of targetDetails) {
      if (rd && rd.ingredient_id) {
        uniqueDetailsMap.set(rd.ingredient_id, rd);
      }
    }

    const details = Array.from(uniqueDetailsMap.values()).map((rd) => {
      const ing = ingredients.find((i) => i.id === rd.ingredient_id);
      const unit = units.find((u) => u.id === ing?.unit_id);
      return {
        ...rd,
        ingredient: ing,
        unit: unit,
      };
    });

    return { recipe, details };
  };

  // Transactions Handlers
  const addPurchaseTransaction = (
    date: string,
    supplierId: string,
    refNo: string,
    notes: string,
    items: PurchaseItemInput[]
  ) => {
    const now = Date.now();
    const trxId = `trx-pur-${now}`;
    const isoDate = date ? (date.includes('T') ? date : `${date}T12:00:00.000Z`) : new Date(now).toISOString();
    const newTrx: Transaction = {
      id: trxId,
      type: 'purchase',
      transaction_date: isoDate,
      reference_no: refNo || generateRefNo('PUR'),
      supplier_id: supplierId,
      notes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient_id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const currentStock = getIngredientCurrentStock(currentIng, stockMovements);
        const newStock = currentStock + Number(item.quantity);
        updatedIngredients[ingIndex] = {
          ...currentIng,
          current_stock: newStock,
          cost_per_unit: item.unit_price > 0 ? item.unit_price : currentIng.cost_per_unit,
        };

        const supplierName = suppliers.find((s) => s.id === supplierId)?.name || 'Supplier';
        newMovements.push({
          id: `mov-${now}-${index}`,
          transaction_id: trxId,
          ingredient_id: item.ingredient_id,
          type: 'in',
          quantity: Number(item.quantity),
          balance_after: newStock,
          description: `Pembelian dari ${supplierName} (${refNo || 'PO'})`,
          created_at: new Date(now + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      items.some((item) => item.ingredient_id === ing.id)
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
    const isoDate = date ? (date.includes('T') ? date : `${date}T12:00:00.000Z`) : new Date(now).toISOString();
    const newTrx: Transaction = {
      id: trxId,
      type: 'prepare',
      transaction_date: isoDate,
      reference_no: refNo || generateRefNo('PREP'),
      notes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient_id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const qty = Number(item.quantity);
        const currentStock = getIngredientCurrentStock(currentIng, stockMovements);

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
          ingredient_id: item.ingredient_id,
          type: item.is_target ? 'in' : 'out',
          quantity: qty,
          balance_after: newStock,
          description: item.is_target
            ? `Hasil Proses Prepare / Konversi (${refNo || 'PREP'})`
            : `Pemakaian Bahan Mentah untuk Prepare (${refNo || 'PREP'})`,
          created_at: new Date(now + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      items.some((item) => item.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);
  };

  const checkProductionSufficiency = (menuId: string, portionCount: number): ProductionSufficiencyResult => {
    const { details } = getMenuRecipeDetails(menuId);
    let isSufficient = true;

    const items = details.map((d) => {
      const ing = ingredients.find((i) => i.id === d.ingredient_id);
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
    menuId: string,
    portionCount: number,
    refNo: string,
    notes: string
  ) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return { success: false, message: 'Menu tidak ditemukan' };

    const sufficiency = checkProductionSufficiency(menuId, portionCount);
    if (sufficiency.items.length === 0) {
      return { success: false, message: 'Resep untuk menu ini belum dikonfigurasi' };
    }

    const now = Date.now();
    const trxId = `trx-prod-${now}`;
    const isoDate = date ? (date.includes('T') ? date : `${date}T12:00:00.000Z`) : new Date(now).toISOString();
    const newTrx: Transaction = {
      id: trxId,
      type: 'production',
      transaction_date: isoDate,
      reference_no: refNo || generateRefNo('PROD'),
      menu_id: menuId,
      portion_count: portionCount,
      notes,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    sufficiency.items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient.id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const currentStock = getIngredientCurrentStock(currentIng, stockMovements);
        const newStock = currentStock - item.requiredQty;
        updatedIngredients[ingIndex] = { ...currentIng, current_stock: newStock };

        newMovements.push({
          id: `mov-${now}-${index}`,
          transaction_id: trxId,
          ingredient_id: item.ingredient.id,
          type: 'out',
          quantity: item.requiredQty,
          balance_after: newStock,
          description: `Produksi / Penjualan ${portionCount} porsi ${menu.name} (${refNo || 'PROD'})`,
          created_at: new Date(now + index * 10).toISOString(),
        });
      }
    });

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [...newMovements, ...stockMovements];

    setIngredients(updatedIngredients);
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    const changedIngs = updatedIngredients.filter((ing) =>
      sufficiency.items.some((item) => item.ingredient.id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements, nextTrxs, nextMovs);

    return {
      success: true,
      message: `Berhasil mencatat produksi/penjualan ${portionCount} porsi ${menu.name}. Stok bahan telah terpotong otomatis.`,
    };
  };

  // Helper to get actual current stock based on latest stock movement balance_after
  const getIngredientCurrentStock = (ing: Ingredient, movements: StockMovement[]): number => {
    if (!ing) return 0;
    const ingId = String(ing.id || '').trim().toLowerCase();
    const ingCode = String(ing.code || '').trim().toLowerCase();

    const ingMovs = movements.filter((m) => {
      if (!m || !m.ingredient_id) return false;
      const mId = String(m.ingredient_id).trim().toLowerCase();
      return mId === ingId || mId === ingCode;
    });

    if (ingMovs.length > 0) {
      const sortedMovs = [...ingMovs].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id));
      });
      const latest = sortedMovs[0];
      if (latest && latest.balance_after !== undefined && latest.balance_after !== null && !isNaN(Number(latest.balance_after))) {
        return Number(latest.balance_after);
      }
    }
    return Number(ing.current_stock) || 0;
  };

  const addAdjustmentTransaction = (
    date: string,
    ingredientId: string,
    quantity: number,
    mode: 'plus' | 'minus' | 'set',
    reason: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    notes: string
  ) => {
    const ing = ingredients.find((i) => i.id === ingredientId || i.code === ingredientId);
    if (!ing) return;

    const now = Date.now();
    const trxId = `trx-adj-${now}`;
    const refNo = generateRefNo('ADJ');
    const qty = Number(quantity);

    const currentStock = getIngredientCurrentStock(ing, stockMovements);

    let newStock = currentStock;
    let moveQty = qty;
    let moveType: 'in' | 'out' = 'out';

    if (mode === 'set') {
      newStock = qty;
      const diff = newStock - currentStock;
      moveType = diff >= 0 ? 'in' : 'out';
      moveQty = Math.abs(diff);
    } else if (mode === 'plus') {
      newStock = currentStock + qty;
      moveType = 'in';
      moveQty = qty;
    } else {
      newStock = currentStock - qty;
      moveType = 'out';
      moveQty = qty;
    }

    const updatedIng: Ingredient = { ...ing, current_stock: newStock };

    const isoDate = date ? (date.includes('T') ? date : `${date}T12:00:00.000Z`) : new Date(now).toISOString();
    const newTrx: Transaction = {
      id: trxId,
      type: 'adjustment',
      transaction_date: isoDate,
      reference_no: refNo,
      notes: notes || `Penyesuaian stok (${reason})`,
      adjustment_reason: reason,
      created_by: currentUser.name,
      created_at: new Date(now).toISOString(),
    };

    const newMov: StockMovement = {
      id: `mov-${now}`,
      transaction_id: trxId,
      ingredient_id: ing.id,
      type: moveType,
      quantity: moveQty,
      balance_after: newStock,
      description: mode === 'set'
        ? `Stock Opname (Set Langsung): ${currentStock} -> ${newStock} (${notes || reason})`
        : `Penyesuaian Stok (${moveType === 'in' ? '+' : '-'}) Alasan: ${reason} - ${notes}`,
      created_at: new Date(now).toISOString(),
    };

    const nextTrxs = [newTrx, ...transactions];
    const nextMovs = [newMov, ...stockMovements];

    setIngredients((prev) =>
      prev.map((i) => (i.id === ing.id ? updatedIng : i))
    );
    setTransactions(nextTrxs);
    setStockMovements(nextMovs);

    syncDataToSupabase([updatedIng], newTrx, [newMov], nextTrxs, nextMovs);
  };

  // Daily Stock Report Generator
  const getDailyStockReport = (dateFilter: string): DailyStockRow[] => {
    // Standardize filter date to local YYYY-MM-DD
    const getYYYYMMDD = (input: string | Date | undefined | null): string => {
      if (!input) return new Date().toISOString().slice(0, 10);
      if (typeof input === 'string') {
        const trimmed = input.trim();
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
      }
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return new Date().toISOString().slice(0, 10);
    };

    const targetDate = getYYYYMMDD(dateFilter);

    return ingredients.map((ing) => {
      const unit = units.find((u) => u.id === ing.unit_id) || ({ abbreviation: '-' } as Unit);
      const cat = categories.find((c) => c.id === ing.category_id) || ({ name: '-' } as Category);

      const liveStock = getIngredientCurrentStock(ing, stockMovements);

      // Movements on targetDate
      const movementsToday = stockMovements.filter((m) => {
        if (!m || !m.ingredient_id) return false;
        const mId = String(m.ingredient_id).trim().toLowerCase();
        const ingId = String(ing.id).trim().toLowerCase();
        const ingCode = String(ing.code || '').trim().toLowerCase();
        if (mId !== ingId && mId !== ingCode) return false;

        const trx = transactions.find(
          (t) => t.id === m.transaction_id || (t.reference_no && m.description && m.description.includes(t.reference_no))
        );
        const mDate = getYYYYMMDD(trx?.transaction_date || m.created_at);
        return mDate === targetDate;
      });

      // Movements created AFTER targetDate (future relative to report date)
      const movementsAfter = stockMovements.filter((m) => {
        if (!m || !m.ingredient_id) return false;
        const mId = String(m.ingredient_id).trim().toLowerCase();
        const ingId = String(ing.id).trim().toLowerCase();
        const ingCode = String(ing.code || '').trim().toLowerCase();
        if (mId !== ingId && mId !== ingCode) return false;

        const trx = transactions.find(
          (t) => t.id === m.transaction_id || (t.reference_no && m.description && m.description.includes(t.reference_no))
        );
        const mDate = getYYYYMMDD(trx?.transaction_date || m.created_at);
        return mDate > targetDate;
      });

      let in_purchase = 0;
      let in_prepare = 0;
      let out_prepare = 0;
      let out_production = 0;
      let in_adjustment = 0;
      let out_adjustment = 0;

      movementsToday.forEach((m) => {
        const trx = transactions.find(
          (t) => t.id === m.transaction_id || (t.reference_no && m.description && m.description.includes(t.reference_no))
        );
        const descLower = m.description ? m.description.toLowerCase() : '';
        const trxType = trx?.type ? String(trx.type).toLowerCase() : '';

        const isPurchase = trxType === 'purchase' || descLower.includes('pembelian') || descLower.includes('beli') || descLower.includes('pur');
        const isPrepare = trxType === 'prepare' || descLower.includes('prepare') || descLower.includes('konversi') || descLower.includes('prep');
        const isProduction = trxType === 'production' || descLower.includes('produksi') || descLower.includes('porsi') || descLower.includes('prod');
        const isAdj = trxType === 'adjustment' || descLower.includes('penyesuaian') || descLower.includes('opname') || descLower.includes('init') || descLower.includes('adj');

        if (isPurchase) {
          if (m.type === 'in') in_purchase += Number(m.quantity) || 0;
        } else if (isPrepare) {
          if (m.type === 'in') in_prepare += Number(m.quantity) || 0;
          if (m.type === 'out') out_prepare += Number(m.quantity) || 0;
        } else if (isProduction) {
          if (m.type === 'out') out_production += Number(m.quantity) || 0;
        } else if (isAdj) {
          if (m.type === 'in') in_adjustment += Number(m.quantity) || 0;
          if (m.type === 'out') out_adjustment += Number(m.quantity) || 0;
        } else {
          if (m.type === 'in') in_adjustment += Number(m.quantity) || 0;
          if (m.type === 'out') out_adjustment += Number(m.quantity) || 0;
        }
      });

      // Future movements calculation
      let in_after = 0;
      let out_after = 0;
      movementsAfter.forEach((m) => {
        if (m.type === 'in') in_after += Number(m.quantity) || 0;
        if (m.type === 'out') out_after += Number(m.quantity) || 0;
      });

      // Stock at the end of targetDate
      const final_stock = liveStock - in_after + out_after;

      // Total changes on targetDate
      const totalTodayIn = in_purchase + in_prepare + in_adjustment;
      const totalTodayOut = out_prepare + out_production + out_adjustment;

      // Stock at the beginning of targetDate
      const initial_stock = final_stock - totalTodayIn + totalTodayOut;

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
        const mId = String(m.ingredient_id).toLowerCase();
        return mId === targetId || mId === targetCode;
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
          }, ${ing.cost_per_unit || 0})`
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Menus Table
CREATE TABLE IF NOT EXISTS public.menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

INSERT INTO public.ingredients (id, code, name, category_id, unit_id, type, min_stock, current_stock, is_active, cost_per_unit) VALUES
${ingredientInserts}
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  unit_id = EXCLUDED.unit_id,
  type = EXCLUDED.type,
  min_stock = EXCLUDED.min_stock,
  is_active = EXCLUDED.is_active,
  cost_per_unit = EXCLUDED.cost_per_unit;

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

        transactions,
        stockMovements,
        addPurchaseTransaction,
        addPrepareTransaction,
        checkProductionSufficiency,
        addProductionTransaction,
        addAdjustmentTransaction,

        isSyncing,
        lastSyncedAt,
        supabaseError,
        pushAllToSupabase,
        pullFromSupabase,

        getDailyStockReport,
        getIngredientLedger,

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
