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
} from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@mecamocha.id',
    name: 'Super Admin Mecamocha',
    is_superadmin: true,
    role: 'super_admin',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'usr-staff-1',
    email: 'karyawan@mecamocha.id',
    name: 'Budi (Karyawan Kitchen)',
    is_superadmin: false,
    role: 'karyawan',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_UNITS: Unit[] = [
  { id: 'u-1', name: 'Gram', abbreviation: 'g' },
  { id: 'u-2', name: 'Milliliter', abbreviation: 'ml' },
  { id: 'u-3', name: 'Pieces', abbreviation: 'pcs' },
  { id: 'u-4', name: 'Pack', abbreviation: 'pack' },
  { id: 'u-5', name: 'Kilogram', abbreviation: 'kg' },
  { id: 'u-6', name: 'Liter', abbreviation: 'l' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c-1', name: 'Daging & Protein' },
  { id: 'c-2', name: 'Bumbu & Saus' },
  { id: 'c-3', name: 'Buah & Buah Segar' },
  { id: 'c-4', name: 'Tepung & Bahan Kering' },
  { id: 'c-5', name: 'Bahan Setengah Jadi (PP)' },
  { id: 'c-6', name: 'Kemasan & Catering' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's-1', name: 'PT Boga Utama Jaya', contact: '0812-3456-7890', address: 'Jl. Industri Raya No. 45, Jakarta' },
  { id: 's-2', name: 'CV Sumber Segar Abadi', contact: '0857-1122-3344', address: 'Pasar Induk Kramat Jati Blok C' },
  { id: 's-3', name: 'Toko Bahan Kue & Minuman Jaya', contact: '0821-9988-7766', address: 'Jl. Kebon Jeruk No. 12' },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing-1',
    code: 'RAW-001',
    name: 'Dada Ayam Mentah',
    category_id: 'c-1',
    unit_id: 'u-1',
    type: 'raw',
    min_stock: 2000,
    current_stock: 5000, // 5000g = 5kg
    is_active: true,
    cost_per_unit: 50, // 50 IDR per gram
  },
  {
    id: 'ing-2',
    code: 'RAW-002',
    name: 'Tepung Crispy Special',
    category_id: 'c-4',
    unit_id: 'u-1',
    type: 'raw',
    min_stock: 1000,
    current_stock: 800, // Low stock alert trigger!
    is_active: true,
    cost_per_unit: 15,
  },
  {
    id: 'ing-3',
    code: 'RAW-003',
    name: 'Pisang Kepok Segar',
    category_id: 'c-3',
    unit_id: 'u-3',
    type: 'raw',
    min_stock: 30,
    current_stock: 100, // 100 pcs
    is_active: true,
    cost_per_unit: 1500,
  },
  {
    id: 'ing-4',
    code: 'RAW-004',
    name: 'Minyak Goreng Sawit',
    category_id: 'c-2',
    unit_id: 'u-2',
    type: 'raw',
    min_stock: 2000,
    current_stock: 10000, // 10,000 ml
    is_active: true,
    cost_per_unit: 20,
  },
  {
    id: 'ing-5',
    code: 'RAW-005',
    name: 'Keju Mozzarella',
    category_id: 'c-1',
    unit_id: 'u-1',
    type: 'raw',
    min_stock: 500,
    current_stock: 300, // Low stock!
    is_active: true,
    cost_per_unit: 120,
  },
  {
    id: 'ing-6',
    code: 'RAW-006',
    name: 'Saus Caramel Base',
    category_id: 'c-2',
    unit_id: 'u-2',
    type: 'raw',
    min_stock: 1000,
    current_stock: 2500,
    is_active: true,
    cost_per_unit: 35,
  },
  // Prepared ingredients (PP)
  {
    id: 'ing-pp-1',
    code: 'PP-001',
    name: 'Ayam Marinasi Special (PP)',
    category_id: 'c-5',
    unit_id: 'u-1',
    type: 'prepared',
    min_stock: 1000,
    current_stock: 3500,
    is_active: true,
    cost_per_unit: 60,
  },
  {
    id: 'ing-pp-2',
    code: 'PP-002',
    name: 'Adonan Pisang Crispy (PP)',
    category_id: 'c-5',
    unit_id: 'u-1',
    type: 'prepared',
    min_stock: 500,
    current_stock: 1200,
    is_active: true,
    cost_per_unit: 25,
  },
  {
    id: 'ing-pp-3',
    code: 'PP-003',
    name: 'Brulee Cream Mixture (PP)',
    category_id: 'c-5',
    unit_id: 'u-2',
    type: 'prepared',
    min_stock: 400,
    current_stock: 250, // Low stock!
    is_active: true,
    cost_per_unit: 80,
  },
];

export const INITIAL_MENUS: Menu[] = [
  {
    id: 'm-1',
    name: 'Pisang Goreng Saus Caramel',
    category: 'Snack Sweet',
    price: 28000,
    is_active: true,
    active_recipe_version: 1,
  },
  {
    id: 'm-2',
    name: 'Brulee Bomb Deluxe',
    category: 'Snack Savory',
    price: 35000,
    is_active: true,
    active_recipe_version: 1,
  },
  {
    id: 'm-3',
    name: 'Chicken Crispy Caramel Bowl',
    category: 'Main Course',
    price: 42000,
    is_active: true,
    active_recipe_version: 1,
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    menu_id: 'm-1',
    version: 1,
    is_active: true,
    notes: 'Resep standar Pisang Goreng Caramel 4 pcs per porsi',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rec-2',
    menu_id: 'm-2',
    version: 1,
    is_active: true,
    notes: 'Resep standar Brulee Bomb 5 pcs per porsi',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rec-3',
    menu_id: 'm-3',
    version: 1,
    is_active: true,
    notes: 'Chicken Crispy Bowl porsi 150g ayam marinasi',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_RECIPE_DETAILS: RecipeDetail[] = [
  // Menu 1: Pisang Goreng Saus Caramel
  { id: 'rd-1', recipe_id: 'rec-1', ingredient_id: 'ing-3', quantity: 4 }, // 4 pcs Pisang Kepok
  { id: 'rd-2', recipe_id: 'rec-1', ingredient_id: 'ing-pp-2', quantity: 80 }, // 80g Adonan Pisang
  { id: 'rd-3', recipe_id: 'rec-1', ingredient_id: 'ing-6', quantity: 30 }, // 30ml Saus Caramel Base
  { id: 'rd-4', recipe_id: 'rec-1', ingredient_id: 'ing-4', quantity: 50 }, // 50ml Minyak Goreng

  // Menu 2: Brulee Bomb
  { id: 'rd-5', recipe_id: 'rec-2', ingredient_id: 'ing-pp-3', quantity: 150 }, // 150ml Brulee Cream
  { id: 'rd-6', recipe_id: 'rec-2', ingredient_id: 'ing-5', quantity: 40 }, // 40g Keju Mozzarella
  { id: 'rd-7', recipe_id: 'rec-2', ingredient_id: 'ing-2', quantity: 30 }, // 30g Tepung Crispy
  { id: 'rd-8', recipe_id: 'rec-2', ingredient_id: 'ing-4', quantity: 60 }, // 60ml Minyak

  // Menu 3: Chicken Crispy Caramel Bowl
  { id: 'rd-9', recipe_id: 'rec-3', ingredient_id: 'ing-pp-1', quantity: 150 }, // 150g Ayam Marinasi
  { id: 'rd-10', recipe_id: 'rec-3', ingredient_id: 'ing-2', quantity: 50 }, // 50g Tepung Crispy
  { id: 'rd-11', recipe_id: 'rec-3', ingredient_id: 'ing-6', quantity: 25 }, // 25ml Saus Caramel
  { id: 'rd-12', recipe_id: 'rec-3', ingredient_id: 'ing-4', quantity: 80 }, // 80ml Minyak
];

const todayISO = new Date().toISOString();
const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-1',
    type: 'purchase',
    transaction_date: yesterdayISO,
    reference_no: 'TRX-PUR-20260731-001',
    notes: 'Pembelian mingguan bahan mentah',
    created_by: 'Super Admin Mecamocha',
    supplier_id: 's-1',
    created_at: yesterdayISO,
  },
  {
    id: 'trx-2',
    type: 'prepare',
    transaction_date: yesterdayISO,
    reference_no: 'TRX-PREP-20260731-002',
    notes: 'Prepare marinasi dada ayam 3kg menjadi Ayam Marinasi PP',
    created_by: 'Budi (Karyawan Kitchen)',
    created_at: yesterdayISO,
  },
  {
    id: 'trx-3',
    type: 'production',
    transaction_date: todayISO,
    reference_no: 'TRX-PROD-20260801-003',
    menu_id: 'm-1',
    portion_count: 10,
    notes: 'Penjualan 10 porsi Pisang Goreng Caramel batch pagi',
    created_by: 'Budi (Karyawan Kitchen)',
    created_at: todayISO,
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    transaction_id: 'trx-1',
    ingredient_id: 'ing-1',
    type: 'in',
    quantity: 5000,
    balance_after: 8000,
    description: 'Pembelian dari PT Boga Utama Jaya (Inv: INV-8821)',
    created_at: yesterdayISO,
  },
  {
    id: 'mov-2',
    transaction_id: 'trx-2',
    ingredient_id: 'ing-1',
    type: 'out',
    quantity: 3000,
    balance_after: 5000,
    description: 'Konversi (Prepare) menjadi Ayam Marinasi PP',
    created_at: yesterdayISO,
  },
  {
    id: 'mov-3',
    transaction_id: 'trx-2',
    ingredient_id: 'ing-pp-1',
    type: 'in',
    quantity: 3500,
    balance_after: 3500,
    description: 'Hasil Konversi (Prepare) dari Dada Ayam Mentah',
    created_at: yesterdayISO,
  },
  {
    id: 'mov-4',
    transaction_id: 'trx-3',
    ingredient_id: 'ing-3',
    type: 'out',
    quantity: 40,
    balance_after: 100,
    description: 'Produksi 10 porsi Pisang Goreng Saus Caramel',
    created_at: todayISO,
  },
  {
    id: 'mov-5',
    transaction_id: 'trx-3',
    ingredient_id: 'ing-pp-2',
    type: 'out',
    quantity: 800,
    balance_after: 1200,
    description: 'Produksi 10 porsi Pisang Goreng Saus Caramel',
    created_at: todayISO,
  },
];
