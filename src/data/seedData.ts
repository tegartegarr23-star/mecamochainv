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
  // Raw Ingredients MM001 - MM110
  { id: 'ing-mm001', code: 'MM001', name: 'ALU TRAY', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 10, current_stock: 100, is_active: true, cost_per_unit: 500 },
  { id: 'ing-mm002', code: 'MM002', name: 'BAKING POWDER', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm003', code: 'MM003', name: 'Cookies - BAKING SODA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm004', code: 'MM004', name: 'BAWANG BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm005', code: 'MM005', name: 'BAWANG GORENG', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 80 },
  { id: 'ing-mm006', code: 'MM006', name: 'BAWANG MERAH', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mm007', code: 'MM007', name: 'BAWANG PUTIH', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm008', code: 'MM008', name: 'BERAS NAGA MUTIARA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 10000, is_active: true, cost_per_unit: 15 },
  { id: 'ing-mm009', code: 'MM009', name: 'BLACKPAPPER BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 120 },
  { id: 'ing-mm010', code: 'MM010', name: 'BAWANG BOMBAY', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm011', code: 'MM011', name: 'CABE BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm012', code: 'MM012', name: 'CABE MERAH BESAR', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1000, is_active: true, cost_per_unit: 45 },
  { id: 'ing-mm013', code: 'MM013', name: 'CABE RAWIT', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 800, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm014', code: 'MM014', name: 'Cookies - CARAMEL CRUMBLE', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 70 },
  { id: 'ing-mm015', code: 'MM015', name: 'Cookies - CHOCOCHIP', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 80 },
  { id: 'ing-mm016', code: 'MM016', name: 'Cookies - CHOCOLATOS CHOCOLATE', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm017', code: 'MM017', name: 'CHOCOLATOS MATCHA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm018', code: 'MM018', name: 'CINNAMON POWDER', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 90 },
  { id: 'ing-mm019', code: 'MM019', name: 'CIRENG', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm020', code: 'MM020', name: 'CUKA', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 15 },
  { id: 'ing-mm021', code: 'MM021', name: 'CUP SAUCE', category_id: 'c-6', unit_id: 'u-4', type: 'raw', min_stock: 5, current_stock: 20, is_active: true, cost_per_unit: 12000 },
  { id: 'ing-mm022', code: 'MM022', name: 'DADA FILLET', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm023', code: 'MM023', name: 'DAUN JERUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm024', code: 'MM024', name: 'EDO DANISH PASTRY', category_id: 'c-4', unit_id: 'u-4', type: 'raw', min_stock: 5, current_stock: 15, is_active: true, cost_per_unit: 25000 },
  { id: 'ing-mm025', code: 'MM025', name: 'FINNA SAUCE BANGKOK', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm026', code: 'MM026', name: 'FRENCH FRIES', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mm027', code: 'MM027', name: 'GALLETO DARK CHOCOLATE', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 75 },
  { id: 'ing-mm028', code: 'MM028', name: 'GALLETO WHITE CHOCOLATE', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 75 },
  { id: 'ing-mm029', code: 'MM029', name: 'GARAM', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 10 },
  { id: 'ing-mm030', code: 'MM030', name: 'GARPU PLASTIK JERAPAH', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 300, is_active: true, cost_per_unit: 150 },
  { id: 'ing-mm031', code: 'MM031', name: 'GARPU PLASTIK VICTORY', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 300, is_active: true, cost_per_unit: 150 },
  { id: 'ing-mm032', code: 'MM032', name: 'GOLDENFIL CHOCO CRUNCHY', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 65 },
  { id: 'ing-mm033', code: 'MM033', name: 'GOURMATE SAUS KEJU', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm034', code: 'MM034', name: 'GREASEPROOF', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 100 },
  { id: 'ing-mm035', code: 'MM035', name: 'GULA AREN CRUMBLE KITCHEN', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm036', code: 'MM036', name: 'GULA PASIR', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 16 },
  { id: 'ing-mm037', code: 'MM037', name: 'HAM HEMATO', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm038', code: 'MM038', name: 'HAM V', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm039', code: 'MM039', name: 'HOLLMAN BUTTER', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 120 },
  { id: 'ing-mm040', code: 'MM040', name: 'ICE CREAM AICE', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm041', code: 'MM041', name: 'KECAP MANIS', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm042', code: 'MM042', name: 'KEJU CHEDAR', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 70 },
  { id: 'ing-mm043', code: 'MM043', name: 'KEJU MOZARELLA', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1200, is_active: true, cost_per_unit: 110 },
  { id: 'ing-mm044', code: 'MM044', name: 'KERUPUK KELINCI', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm045', code: 'MM045', name: 'KNORR DEMIGLACE', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 150 },
  { id: 'ing-mm046', code: 'MM046', name: 'LADA BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 100 },
  { id: 'ing-mm047', code: 'MM047', name: 'LENGKUAS', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm048', code: 'MM048', name: 'LOTUS BISCOFF BISCUIT', category_id: 'c-4', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 1500 },
  { id: 'ing-mm049', code: 'MM049', name: 'LOTUS BISCOFF SELAI', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 140 },
  { id: 'ing-mm050', code: 'MM050', name: 'MARGARIN', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm051', code: 'MM051', name: 'MARGARIN BLUEBAND', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mm052', code: 'MM052', name: 'MAYONAISE MAESTRO', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm053', code: 'MM053', name: 'MICHIN SASA', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm054', code: 'MM054', name: 'MICIN KOKI', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm055', code: 'MM055', name: 'MINYAK GORENG', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 2000, current_stock: 10000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm056', code: 'MM056', name: 'NUGGET HEMATO', category_id: 'c-1', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 800 },
  { id: 'ing-mm057', code: 'MM057', name: 'NUTMEG GROUND', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 110 },
  { id: 'ing-mm058', code: 'MM058', name: 'OTAK-OTAK', category_id: 'c-1', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 600 },
  { id: 'ing-mm059', code: 'MM059', name: 'PAHA AYAM', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 45 },
  { id: 'ing-mm060', code: 'MM060', name: 'PAPRIKA BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 80 },
  { id: 'ing-mm061', code: 'MM061', name: 'PARSLEY BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 300, is_active: true, cost_per_unit: 100 },
  { id: 'ing-mm062', code: 'MM062', name: 'PISANG RAJA', category_id: 'c-3', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 150, is_active: true, cost_per_unit: 1500 },
  { id: 'ing-mm063', code: 'MM063', name: 'PISAU PLASTIK', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 200 },
  { id: 'ing-mm064', code: 'MM064', name: 'PLASTIK TAKE AWAY BESAR', category_id: 'c-6', unit_id: 'u-4', type: 'raw', min_stock: 10, current_stock: 30, is_active: true, cost_per_unit: 15000 },
  { id: 'ing-mm065', code: 'MM065', name: 'ROTI TAWAR BOROBUDUR', category_id: 'c-4', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 50, is_active: true, cost_per_unit: 1000 },
  { id: 'ing-mm066', code: 'MM066', name: 'ROYCO SAPI', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm067', code: 'MM067', name: 'SAUS HOT LAVA', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 45 },
  { id: 'ing-mm068', code: 'MM068', name: 'SAUS SAMBAL LOGAN', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm069', code: 'MM069', name: 'SAUS TOMAT LOGAN', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm070', code: 'MM070', name: 'SAWI', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 15 },
  { id: 'ing-mm071', code: 'MM071', name: 'SELADA', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm072', code: 'MM072', name: 'SENDOK PLASTIK', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 150 },
  { id: 'ing-mm073', code: 'MM073', name: 'SERAI', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm074', code: 'MM074', name: 'SHORT PLATE', category_id: 'c-1', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 120 },
  { id: 'ing-mm075', code: 'MM075', name: 'SKM', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm076', code: 'MM076', name: 'SOSIS HEMATO', category_id: 'c-1', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 1000 },
  { id: 'ing-mm077', code: 'MM077', name: 'STRAWBERRY', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm078', code: 'MM078', name: 'SUSU BUBUK', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 80 },
  { id: 'ing-mm079', code: 'MM079', name: 'SUSU INDOMILK UHT', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm080', code: 'MM080', name: 'TELUR', category_id: 'c-1', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 2000 },
  { id: 'ing-mm081', code: 'MM081', name: 'TEPUNG BERAS', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 18 },
  { id: 'ing-mm082', code: 'MM082', name: 'TEPUNG MAIZENA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 22 },
  { id: 'ing-mm083', code: 'MM083', name: 'TEPUNG PANIR', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm084', code: 'MM084', name: 'Cookies - TEPUNG TERIGU PRO SEDANG', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 15 },
  { id: 'ing-mm085', code: 'MM085', name: 'TERASI ABC', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm086', code: 'MM086', name: 'TEPUNG TERIGU', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 14 },
  { id: 'ing-mm087', code: 'MM087', name: 'TIMUN', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 15 },
  { id: 'ing-mm088', code: 'MM088', name: 'TOAST MILK LOAF', category_id: 'c-4', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 60, is_active: true, cost_per_unit: 1200 },
  { id: 'ing-mm089', code: 'MM089', name: 'TOMAT', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 18 },
  { id: 'ing-mm090', code: 'MM090', name: 'TRAY BOX MECAMOCHA DINE IN', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 1000 },
  { id: 'ing-mm091', code: 'MM091', name: 'TRAY BOX TAKEAWAY', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 50, current_stock: 200, is_active: true, cost_per_unit: 1200 },
  { id: 'ing-mm092', code: 'MM092', name: 'TUSUKAN', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mm093', code: 'MM093', name: 'Cookies - UNSALTED BUTTER', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 110 },
  { id: 'ing-mm094', code: 'MM094', name: 'VAN HAUTEN', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 130 },
  { id: 'ing-mm095', code: 'MM095', name: 'VANILLA BUBUK', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 90 },
  { id: 'ing-mm096', code: 'MM096', name: 'VANILLA CAIR', category_id: 'c-2', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 85 },
  { id: 'ing-mm097', code: 'MM097', name: 'WIJEN', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 60 },
  { id: 'ing-mm098', code: 'MM098', name: 'WORTEL', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 20 },
  { id: 'ing-mm099', code: 'MM099', name: 'ASTERY MATCHA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 140 },
  { id: 'ing-mm100', code: 'MM100', name: 'DAUN BAWANG', category_id: 'c-3', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm101', code: 'MM101', name: 'JAHE', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm102', code: 'MM102', name: 'GULA JAWA', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-mm103', code: 'MM103', name: 'KETUMBAR BUBUK', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 40 },
  { id: 'ing-mm104', code: 'MM104', name: 'ASAM JAWA', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mm105', code: 'MM105', name: 'AIR', category_id: 'c-2', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 10000, is_active: true, cost_per_unit: 1 },
  { id: 'ing-mm106', code: 'MM106', name: 'Cookies - GOLDENFIL CHOCO CRUNCHY', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 65 },
  { id: 'ing-mm107', code: 'MM107', name: 'Cookies - BAKING POWDER', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 400, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm108', code: 'MM108', name: 'Cookies - GULA AREN CRUMBLE', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 30 },
  { id: 'ing-mm109', code: 'MM109', name: 'Cookies - GULA PASIR', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 16 },
  { id: 'ing-mm110', code: 'MM110', name: 'Cookies - Tepung Maizena', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 22 },

  // Prepared Ingredients PP001 - PP020
  { id: 'ing-pp001', code: 'PP001', name: 'PP AYAM SAMBEL MATAH', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 65 },
  { id: 'ing-pp002', code: 'PP002', name: 'PP SAMBAL BAWANG', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 50 },
  { id: 'ing-pp003', code: 'PP003', name: 'PP TEPUNG BASAH', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-pp004', code: 'PP004', name: 'PP TEPUNG BASAH PISANG', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-pp005', code: 'PP005', name: 'PP SAUS DARK CHOCOLATE', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 80 },
  { id: 'ing-pp006', code: 'PP006', name: 'PP SAUS VANILLA', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 75 },
  { id: 'ing-pp007', code: 'PP007', name: 'PP SAUS NASHVILLE', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 70 },
  { id: 'ing-pp008', code: 'PP008', name: 'PP SAMBAL TERASI', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 55 },
  { id: 'ing-pp009', code: 'PP009', name: 'PP BUMBU MARANGGI', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 60 },
  { id: 'ing-pp010', code: 'PP010', name: 'PP BUMBU NASI GORENG', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 45 },
  { id: 'ing-pp011', code: 'PP011', name: 'PP DAUN JERUK', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 200, current_stock: 800, is_active: true, cost_per_unit: 35 },
  { id: 'ing-pp012', code: 'PP012', name: 'PP MARINASI NASHVILLE', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 55 },
  { id: 'ing-pp013', code: 'PP013', name: 'PP MARINASI BAPUT', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-pp014', code: 'PP014', name: 'PP ACAR', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 30 },
  { id: 'ing-pp015', code: 'PP015', name: 'PP SAUS CARAMEL', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 85 },
  { id: 'ing-pp016', code: 'PP016', name: 'PP COATING SUSU', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 3000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-pp017', code: 'PP017', name: 'PP KAILAN', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 1500, is_active: true, cost_per_unit: 35 },
  { id: 'ing-pp018', code: 'PP018', name: 'PP BRULLEE BOMB', category_id: 'c-5', unit_id: 'u-3', type: 'prepared', min_stock: 20, current_stock: 100, is_active: true, cost_per_unit: 3500 },
  { id: 'ing-pp019', code: 'PP019', name: 'PP TEPUNG MIX', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-pp020', code: 'PP020', name: 'PP COOKIES', category_id: 'c-5', unit_id: 'u-3', type: 'prepared', min_stock: 30, current_stock: 120, is_active: true, cost_per_unit: 4000 },
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
