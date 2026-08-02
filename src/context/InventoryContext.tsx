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
      // Fallback if legacy ingredients list with < 10 items (RAW-001 demo)
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

  // State Declarations
  const [users, setUsers] = useState<AppUser[]>(() => loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<AppUser>(() => loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]));
  const [units, setUnits] = useState<Unit[]>(() => loadFromStorage(STORAGE_KEYS.UNITS, INITIAL_UNITS));
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => loadFromStorage(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS));
  const [menus, setMenus] = useState<Menu[]>(() => loadFromStorage(STORAGE_KEYS.MENUS, INITIAL_MENUS));
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadFromStorage(STORAGE_KEYS.RECIPES, INITIAL_RECIPES));
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>(() => loadFromStorage(STORAGE_KEYS.RECIPE_DETAILS, INITIAL_RECIPE_DETAILS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadFromStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS));

  // Sync data updates to Supabase
  const syncDataToSupabase = async (
    changedIngredients?: Ingredient[],
    newTrx?: Transaction,
    newMovements?: StockMovement[]
  ) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      if (changedIngredients && changedIngredients.length > 0) {
        const cleanIngredients = changedIngredients.map((ing) => ({
          id: ing.id,
          code: ing.code,
          name: ing.name,
          category_id: ing.category_id || null,
          unit_id: ing.unit_id || null,
          type: ing.type || 'raw',
          min_stock: Number(ing.min_stock) || 0,
          current_stock: Number(ing.current_stock) || 0,
          is_active: ing.is_active ?? true,
          cost_per_unit: Number(ing.cost_per_unit) || 0,
        }));

        const { error } = await supabase.from('ingredients').upsert(cleanIngredients);
        if (error) {
          console.error('Supabase ingredients upsert error:', error);
          setSupabaseError(`Gagal sync bahan: ${error.message}`);
          return;
        }

        // Explicitly update current_stock to guarantee direct field mutation in Supabase
        for (const cleanIng of cleanIngredients) {
          await supabase
            .from('ingredients')
            .update({ current_stock: cleanIng.current_stock })
            .eq('id', cleanIng.id);
        }
      }

      if (newTrx) {
        const { error } = await supabase.from('transactions').upsert([newTrx]);
        if (error) {
          console.error('Supabase transaction upsert error:', error);
          setSupabaseError(`Gagal sync transaksi: ${error.message}`);
          return;
        }
      }

      if (newMovements && newMovements.length > 0) {
        const { error } = await supabase.from('stock_movements').upsert(newMovements);
        if (error) {
          console.error('Supabase movements upsert error:', error);
          setSupabaseError(`Gagal sync mutasi: ${error.message}`);
          return;
        }
      }

      setLastSyncedAt(new Date());
      setSupabaseError(null);
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
        { data: sbIngredients, error: ingErr },
        { data: sbMenus },
        { data: sbRecipes },
        { data: sbRecipeDetails },
        { data: sbTransactions, error: trxErr },
        { data: sbStockMovements, error: movErr },
      ] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('categories').select('*'),
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

      if (sbUnits && sbUnits.length > 0) setUnits(sbUnits);
      if (sbCategories && sbCategories.length > 0) setCategories(sbCategories);
      if (sbMenus && sbMenus.length > 0) setMenus(sbMenus);
      if (sbRecipes && sbRecipes.length > 0) setRecipes(sbRecipes);
      if (sbRecipeDetails && sbRecipeDetails.length > 0) setRecipeDetails(sbRecipeDetails);
      if (sbTransactions && sbTransactions.length > 0) setTransactions(sbTransactions);

      const movementsToUse = (sbStockMovements && sbStockMovements.length > 0) ? sbStockMovements : stockMovements;
      if (sbStockMovements && sbStockMovements.length > 0) setStockMovements(sbStockMovements);

      if (sbIngredients && sbIngredients.length > 0) {
        const mergedIngredients = sbIngredients.map((ing) => {
          const ingMovs = movementsToUse.filter(
            (m) => m.ingredient_id === ing.id || m.ingredient_id === ing.code
          );
          if (ingMovs.length > 0) {
            const sortedMovs = [...ingMovs].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const latest = sortedMovs[0];
            if (latest.balance_after !== undefined && latest.balance_after !== null) {
              return { ...ing, current_stock: Number(latest.balance_after) };
            }
          }
          return { ...ing, current_stock: Number(ing.current_stock) || 0 };
        });

        setIngredients(mergedIngredients);
      }
      setLastSyncedAt(new Date());
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

      // Step 1: Push reference tables first (units, categories, suppliers)
      const refResults = await Promise.all([
        supabase.from('units').upsert(units),
        supabase.from('categories').upsert(categories),
        supabase.from('suppliers').upsert(suppliers),
      ]);
      const refErr = refResults.find((r) => r.error)?.error;
      if (refErr) {
        console.error('Push reference tables error:', refErr);
        setSupabaseError(refErr.message || 'Gagal push kategori/satuan');
        return false;
      }

      // Step 2: Push ingredients and menus
      const mainResults = await Promise.all([
        supabase.from('ingredients').upsert(ingredients),
        supabase.from('menus').upsert(menus),
        supabase.from('recipes').upsert(recipes),
        supabase.from('recipe_details').upsert(recipeDetails),
      ]);
      const mainErr = mainResults.find((r) => r.error)?.error;
      if (mainErr) {
        console.error('Push ingredients/menus error:', mainErr);
        setSupabaseError(mainErr.message || 'Gagal push bahan baku/menu');
        return false;
      }

      // Step 3: Push transactions and stock movements
      const txResults = await Promise.all([
        supabase.from('transactions').upsert(transactions),
        supabase.from('stock_movements').upsert(stockMovements),
      ]);
      const txErr = txResults.find((r) => r.error)?.error;
      if (txErr) {
        console.error('Push transactions error:', txErr);
        setSupabaseError(txErr.message || 'Gagal push transaksi/mutasi');
        return false;
      }

      setLastSyncedAt(new Date());
      return true;
    } catch (e: any) {
      console.error('Push exception:', e);
      setSupabaseError(e?.message || 'Gagal koneksi Supabase');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto Sync on Mount & Periodic Polling for Multi-Device Consistency
  useEffect(() => {
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
  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { id: `u-${Date.now()}`, ...unit };
    setUnits((prev) => [...prev, newUnit]);
  };

  const updateUnit = (id: string, unit: Omit<Unit, 'id'>) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...unit } : u)));
  };

  const deleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat = { id: `c-${Date.now()}`, ...cat };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, cat: Omit<Category, 'id'>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...cat } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplier = (sup: Omit<Supplier, 'id'>) => {
    const newSup = { id: `s-${Date.now()}`, ...sup };
    setSuppliers((prev) => [...prev, newSup]);
  };

  const updateSupplier = (id: string, sup: Omit<Supplier, 'id'>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...sup } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
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

  const addMenu = (menuData: Omit<Menu, 'id'>) => {
    const newMenu: Menu = {
      id: `m-${Date.now()}`,
      ...menuData,
      is_active: menuData.is_active ?? true,
      active_recipe_version: 1,
    };
    setMenus((prev) => [...prev, newMenu]);

    // Create default v1 recipe for menu
    const defaultRec: Recipe = {
      id: `rec-${Date.now()}`,
      menu_id: newMenu.id,
      version: 1,
      is_active: true,
      notes: 'Resep Versi 1 (Awal)',
      created_at: new Date().toISOString(),
    };
    setRecipes((prev) => [...prev, defaultRec]);
  };

  const updateMenu = (id: string, menu: Partial<Menu>) => {
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, ...menu } : m)));
  };

  const deleteMenu = (id: string) => {
    setMenus((prev) => prev.filter((m) => m.id !== id));
  };

  // Recipe Handlers
  const addRecipeVersion = (
    menuId: string,
    notes: string,
    details: Array<{ ingredient_id: string; quantity: number }>
  ) => {
    const menuRecipes = recipes.filter((r) => r.menu_id === menuId);
    const newVersion = menuRecipes.length > 0 ? Math.max(...menuRecipes.map((r) => r.version)) + 1 : 1;

    // Deactivate old recipes
    setRecipes((prev) =>
      prev.map((r) => (r.menu_id === menuId ? { ...r, is_active: false } : r))
    );

    const newRecipe: Recipe = {
      id: `rec-${Date.now()}`,
      menu_id: menuId,
      version: newVersion,
      is_active: true,
      notes: notes || `Resep Versi ${newVersion}`,
      created_at: new Date().toISOString(),
    };

    setRecipes((prev) => [...prev, newRecipe]);

    // Create details
    const newDetails: RecipeDetail[] = details.map((d, index) => ({
      id: `rd-${Date.now()}-${index}`,
      recipe_id: newRecipe.id,
      ingredient_id: d.ingredient_id,
      quantity: Number(d.quantity),
    }));

    setRecipeDetails((prev) => [...prev, ...newDetails]);

    // Update menu active version
    setMenus((prev) =>
      prev.map((m) => (m.id === menuId ? { ...m, active_recipe_version: newVersion } : m))
    );
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
    const targetVersion = version || menus.find((m) => m.id === menuId)?.active_recipe_version || 1;
    const recipe = recipes.find((r) => r.menu_id === menuId && r.version === targetVersion);
    if (!recipe) return { recipe: undefined, details: [] };

    const details = recipeDetails
      .filter((rd) => rd.recipe_id === recipe.id)
      .map((rd) => {
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
    const trxId = `trx-pur-${Date.now()}`;
    const newTrx: Transaction = {
      id: trxId,
      type: 'purchase',
      transaction_date: date || new Date().toISOString(),
      reference_no: refNo || generateRefNo('PUR'),
      supplier_id: supplierId,
      notes,
      created_by: currentUser.name,
      created_at: new Date().toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient_id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const newStock = currentIng.current_stock + Number(item.quantity);
        updatedIngredients[ingIndex] = {
          ...currentIng,
          current_stock: newStock,
          cost_per_unit: item.unit_price > 0 ? item.unit_price : currentIng.cost_per_unit,
        };

        const supplierName = suppliers.find((s) => s.id === supplierId)?.name || 'Supplier';
        newMovements.push({
          id: `mov-${Date.now()}-${index}`,
          transaction_id: trxId,
          ingredient_id: item.ingredient_id,
          type: 'in',
          quantity: Number(item.quantity),
          balance_after: newStock,
          description: `Pembelian dari ${supplierName} (${refNo})`,
          created_at: new Date().toISOString(),
        });
      }
    });

    setIngredients(updatedIngredients);
    setTransactions((prev) => [newTrx, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    const changedIngs = updatedIngredients.filter((ing) =>
      items.some((item) => item.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements);
  };

  const addPrepareTransaction = (
    date: string,
    refNo: string,
    notes: string,
    items: PrepareItemInput[]
  ) => {
    const trxId = `trx-prep-${Date.now()}`;
    const newTrx: Transaction = {
      id: trxId,
      type: 'prepare',
      transaction_date: date || new Date().toISOString(),
      reference_no: refNo || generateRefNo('PREP'),
      notes,
      created_by: currentUser.name,
      created_at: new Date().toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient_id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const qty = Number(item.quantity);

        let newStock = currentIng.current_stock;
        if (item.is_target) {
          // Prepared target (In)
          newStock += qty;
        } else {
          // Source raw ingredient (Out)
          newStock -= qty;
        }

        updatedIngredients[ingIndex] = { ...currentIng, current_stock: newStock };

        newMovements.push({
          id: `mov-${Date.now()}-${index}`,
          transaction_id: trxId,
          ingredient_id: item.ingredient_id,
          type: item.is_target ? 'in' : 'out',
          quantity: qty,
          balance_after: newStock,
          description: item.is_target
            ? `Hasil Proses Prepare / Konversi (${refNo})`
            : `Pemakaian Bahan Mentah untuk Prepare (${refNo})`,
          created_at: new Date().toISOString(),
        });
      }
    });

    setIngredients(updatedIngredients);
    setTransactions((prev) => [newTrx, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    const changedIngs = updatedIngredients.filter((ing) =>
      items.some((item) => item.ingredient_id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements);
  };

  const checkProductionSufficiency = (menuId: string, portionCount: number): ProductionSufficiencyResult => {
    const { details } = getMenuRecipeDetails(menuId);
    let isSufficient = true;

    const items = details.map((d) => {
      const ing = ingredients.find((i) => i.id === d.ingredient_id);
      const unit = units.find((u) => u.id === ing?.unit_id);
      const requiredQty = (d.quantity || 0) * portionCount;
      const currentStock = ing ? ing.current_stock : 0;
      const isShortage = currentStock < requiredQty;

      if (isShortage) {
        isSufficient = false;
      }

      return {
        ingredient: ing || ({ name: 'Unknown Ingredient', code: 'N/A', current_stock: 0 } as Ingredient),
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

    const trxId = `trx-prod-${Date.now()}`;
    const newTrx: Transaction = {
      id: trxId,
      type: 'production',
      transaction_date: date || new Date().toISOString(),
      reference_no: refNo || generateRefNo('PROD'),
      menu_id: menuId,
      portion_count: portionCount,
      notes,
      created_by: currentUser.name,
      created_at: new Date().toISOString(),
    };

    const newMovements: StockMovement[] = [];
    const updatedIngredients = [...ingredients];

    sufficiency.items.forEach((item, index) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === item.ingredient.id);
      if (ingIndex !== -1) {
        const currentIng = updatedIngredients[ingIndex];
        const newStock = currentIng.current_stock - item.requiredQty;
        updatedIngredients[ingIndex] = { ...currentIng, current_stock: newStock };

        newMovements.push({
          id: `mov-${Date.now()}-${index}`,
          transaction_id: trxId,
          ingredient_id: item.ingredient.id,
          type: 'out',
          quantity: item.requiredQty,
          balance_after: newStock,
          description: `Produksi ${portionCount} porsi menu ${menu.name} (${refNo})`,
          created_at: new Date().toISOString(),
        });
      }
    });

    setIngredients(updatedIngredients);
    setTransactions((prev) => [newTrx, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    const changedIngs = updatedIngredients.filter((ing) =>
      sufficiency.items.some((item) => item.ingredient.id === ing.id)
    );
    syncDataToSupabase(changedIngs, newTrx, newMovements);

    return {
      success: true,
      message: `Berhasil mencatat produksi ${portionCount} porsi ${menu.name}. Stok bahan telah terpotong otomatis.`,
    };
  };

  const addAdjustmentTransaction = (
    date: string,
    ingredientId: string,
    quantity: number,
    mode: 'plus' | 'minus' | 'set',
    reason: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other',
    notes: string
  ) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    const trxId = `trx-adj-${Date.now()}`;
    const refNo = generateRefNo('ADJ');
    const qty = Number(quantity);

    let newStock = ing.current_stock;
    let moveQty = qty;
    let moveType: 'in' | 'out' = 'out';

    if (mode === 'set') {
      newStock = Math.max(0, qty);
      const diff = newStock - ing.current_stock;
      moveType = diff >= 0 ? 'in' : 'out';
      moveQty = Math.abs(diff);
    } else if (mode === 'plus') {
      newStock = ing.current_stock + qty;
      moveType = 'in';
      moveQty = qty;
    } else {
      newStock = Math.max(0, ing.current_stock - qty);
      moveType = 'out';
      moveQty = qty;
    }

    const updatedIng: Ingredient = { ...ing, current_stock: newStock };

    const newTrx: Transaction = {
      id: trxId,
      type: 'adjustment',
      transaction_date: date || new Date().toISOString(),
      reference_no: refNo,
      notes: notes || `Penyesuaian stok (${reason})`,
      adjustment_reason: reason,
      created_by: currentUser.name,
      created_at: new Date().toISOString(),
    };

    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      transaction_id: trxId,
      ingredient_id: ingredientId,
      type: moveType,
      quantity: moveQty,
      balance_after: newStock,
      description: mode === 'set'
        ? `Stock Opname (Set Langsung): ${ing.current_stock} -> ${newStock} (${notes || reason})`
        : `Penyesuaian Stok (${moveType === 'in' ? '+' : '-'}) Alasan: ${reason} - ${notes}`,
      created_at: new Date().toISOString(),
    };

    setIngredients((prev) =>
      prev.map((i) => (i.id === ingredientId ? updatedIng : i))
    );
    setTransactions((prev) => [newTrx, ...prev]);
    setStockMovements((prev) => [newMov, ...prev]);

    syncDataToSupabase([updatedIng], newTrx, [newMov]);
  };

  // Daily Stock Report Generator
  const getDailyStockReport = (dateFilter: string): DailyStockRow[] => {
    // Standardize filter date to local YYYY-MM-DD
    const getYYYYMMDD = (input: string | Date): string => {
      if (!input) return new Date().toISOString().slice(0, 10);
      if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
      }
      const d = new Date(input);
      if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const targetDate = getYYYYMMDD(dateFilter);

    return ingredients.map((ing) => {
      const unit = units.find((u) => u.id === ing.unit_id) || ({ abbreviation: '-' } as Unit);
      const cat = categories.find((c) => c.id === ing.category_id) || ({ name: '-' } as Category);

      // Movements on targetDate
      const movementsToday = stockMovements.filter((m) => {
        if (m.ingredient_id !== ing.id && m.ingredient_id !== ing.code) return false;
        return getYYYYMMDD(m.created_at) === targetDate;
      });

      // Movements created AFTER targetDate (future relative to report date)
      const movementsAfter = stockMovements.filter((m) => {
        if (m.ingredient_id !== ing.id && m.ingredient_id !== ing.code) return false;
        return getYYYYMMDD(m.created_at) > targetDate;
      });

      let in_purchase = 0;
      let in_prepare = 0;
      let out_prepare = 0;
      let out_production = 0;
      let in_adjustment = 0;
      let out_adjustment = 0;

      movementsToday.forEach((m) => {
        const trx = transactions.find((t) => t.id === m.transaction_id);
        const descLower = m.description ? m.description.toLowerCase() : '';
        const isAdj = trx?.type === 'adjustment' || descLower.includes('penyesuaian') || descLower.includes('opname');

        if (trx?.type === 'purchase') {
          if (m.type === 'in') in_purchase += Number(m.quantity) || 0;
        } else if (trx?.type === 'prepare') {
          if (m.type === 'in') in_prepare += Number(m.quantity) || 0;
          if (m.type === 'out') out_prepare += Number(m.quantity) || 0;
        } else if (trx?.type === 'production') {
          if (m.type === 'out') out_production += Number(m.quantity) || 0;
        } else if (isAdj) {
          if (m.type === 'in') in_adjustment += Number(m.quantity) || 0;
          if (m.type === 'out') out_adjustment += Number(m.quantity) || 0;
        } else {
          // Fallback if transaction type is missing
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
      const final_stock = Number(ing.current_stock) - in_after + out_after;

      // Total changes on targetDate
      const totalTodayIn = in_purchase + in_prepare + in_adjustment;
      const totalTodayOut = out_prepare + out_production + out_adjustment;

      // Stock at the beginning of targetDate
      const initial_stock = final_stock - totalTodayIn + totalTodayOut;

      return {
        ingredient: ing,
        unit,
        category: cat,
        initial_stock: Math.max(0, initial_stock),
        in_purchase,
        in_prepare,
        out_prepare,
        out_production,
        in_adjustment,
        out_adjustment,
        final_stock: Math.max(0, final_stock),
      };
    });
  };

  const getIngredientLedger = (ingredientId: string): StockMovement[] => {
    const targetIng = ingredients.find((i) => i.id === ingredientId || i.code === ingredientId);
    const code = targetIng?.code;
    return stockMovements
      .filter((m) => m.ingredient_id === ingredientId || (code && m.ingredient_id === code))
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
