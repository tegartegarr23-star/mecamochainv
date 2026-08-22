/**
 * Mecamocha Inventory System Types
 */

export type UserRole = 'super_admin' | 'karyawan';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  is_superadmin: boolean;
  role: UserRole;
  created_at: string;
}

export interface Unit {
  id: string;
  name: string; // e.g. Gram, Milliliter, Pieces
  abbreviation: string; // e.g. g, ml, pcs, pack
}

export interface Category {
  id: string;
  name: string; // e.g. Daging & Protein, Bumbu & Saus, Minuman, Half-Finished (PP), Kemasan
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export type IngredientType = 'raw' | 'prepared'; // Raw = Bahan Mentah, Prepared = Bahan Setengah Jadi (PP)

export interface Ingredient {
  id: string;
  code: string; // e.g. ING-001
  name: string;
  category_id: string;
  unit_id: string;
  type: IngredientType;
  min_stock: number;
  current_stock: number;
  is_active: boolean;
  cost_per_unit?: number; // Cost estimate for BOM calculation
}

export interface Menu {
  id: string;
  name: string;
  category: string;
  price: number;
  is_active: boolean;
  active_recipe_version?: number;
}

export interface Recipe {
  id: string;
  menu_id: string;
  version: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
}

export interface RecipeDetail {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number; // Qty per 1 portion of menu
}

export type TransactionType = 'purchase' | 'prepare' | 'production' | 'adjustment';

export interface Transaction {
  id: string;
  type: TransactionType;
  transaction_date: string;
  reference_no: string;
  notes?: string;
  created_by: string; // User name or ID
  supplier_id?: string; // For purchase
  menu_id?: string; // For production (primary/legacy)
  portion_count?: number; // For production (total portions)
  production_items?: ProductionItemInput[]; // For multi-menu production
  adjustment_items?: AdjustmentItemInput[]; // For adjustment transactions
  adjustment_reason?: 'Loss' | 'Damage' | 'Expired' | 'Stock Opname' | 'Other'; // For adjustment
  created_at: string;
}

export type MovementType = 'in' | 'out';

export interface StockMovement {
  id: string;
  transaction_id: string;
  ingredient_id: string;
  type: MovementType;
  quantity: number;
  balance_after: number;
  description: string;
  created_at: string;
}

// Helper structure for Purchase items
export interface PurchaseItemInput {
  ingredient_id: string;
  quantity: number;
  unit_price: number;
}

// Helper structure for Prepare conversion
export interface PrepareItemInput {
  ingredient_id: string;
  quantity: number;
  is_target: boolean; // false = source (out), true = target (in)
}

// Helper structure for Production / Penjualan items
export interface ProductionItemInput {
  menu_id: string;
  portion_count: number;
}

// Helper structure for Adjustment items
export interface AdjustmentItemInput {
  ingredient_id: string;
  quantity: number;
  mode: 'plus' | 'minus' | 'set';
  item_notes?: string;
}

// Daily Stock Report Row
export interface DailyStockRow {
  ingredient: Ingredient;
  unit: Unit;
  category: Category;
  initial_stock: number;
  in_purchase: number;
  in_prepare: number;
  out_prepare: number;
  out_production: number;
  out_adjustment: number;
  in_adjustment: number;
  final_stock: number;
}
