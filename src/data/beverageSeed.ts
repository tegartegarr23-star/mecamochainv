import { Ingredient, Menu, Recipe, RecipeDetail } from '../types';

export const BEVERAGE_INGREDIENTS: Ingredient[] = [
  // Raw Beverage Ingredients
  { id: 'ing-hou', code: 'HOU', name: 'Houseblend Beans', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 3000, is_active: true, cost_per_unit: 180 },
  { id: 'ing-kri', code: 'KRI', name: 'Krimer', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2500, is_active: true, cost_per_unit: 45 },
  { id: 'ing-frm', code: 'FRM', name: 'Indomilk Full Cream UHT', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-cui', code: 'CUI', name: 'Cup Ice', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 100, current_stock: 1000, is_active: true, cost_per_unit: 500 },
  { id: 'ing-cul', code: 'CUL', name: 'Cup Lid', category_id: 'c-6', unit_id: 'u-3', type: 'raw', min_stock: 100, current_stock: 1000, is_active: true, cost_per_unit: 200 },
  { id: 'ing-acp', code: 'ACP', name: 'Astery Chocolate Powder', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 120 },
  { id: 'ing-gre', code: 'GRE', name: 'Freshmilk', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 22 },
  { id: 'ing-skg', code: 'SKG', name: 'SKM Indomilk', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 1000, current_stock: 4000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-gac', code: 'GAC', name: 'Galon Cleo', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 5000, current_stock: 30000, is_active: true, cost_per_unit: 2 },
  { id: 'ing-shi', code: 'SHI', name: 'Shineroad', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 80 },
  { id: 'ing-ses', code: 'SES', name: 'Sea Salt', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 50 },
  { id: 'ing-mib', code: 'MIB', name: 'Mix Berries', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 100 },
  { id: 'ing-mat', code: 'MAT', name: 'Madu TJ', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 150 },
  { id: 'ing-toc', code: 'TOC', name: 'Toffico Caramel Syrup', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 120 },
  { id: 'ing-mav', code: 'MAV', name: 'Marjan Vanilla Syrup', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-tob', code: 'TOB', name: 'Toffico Butterscotch', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 130 },
  { id: 'ing-whs', code: 'WHS', name: 'White Sugar', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 16 },
  { id: 'ing-gaf', code: 'GAF', name: 'Galon All Fresh', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 5000, current_stock: 30000, is_active: true, cost_per_unit: 2 },
  { id: 'ing-drc', code: 'DRC', name: 'Drip Cheese', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 150 },
  { id: 'ing-tep', code: 'TEP', name: 'Teh Poci', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-teg', code: 'TEG', name: 'Teh Gopek', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-ted', code: 'TED', name: 'Teh Dandang', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-tej', code: 'TEJ', name: 'Teh Tongji', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 50 },
  { id: 'ing-sct', code: 'SCT', name: 'Sauce Caramel Toffico', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 140 },
  { id: 'ing-arv', code: 'ARV', name: 'Astery Red Velvet', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 130 },
  { id: 'ing-ast', code: 'AST', name: 'Astery Taro', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 130 },
  { id: 'ing-san', code: 'SAN', name: 'Sanquick', category_id: 'c-7', unit_id: 'u-7', type: 'raw', min_stock: 2, current_stock: 10, is_active: true, cost_per_unit: 35000 },
  { id: 'ing-crc', code: 'CRC', name: 'Crumble Caramel', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 80 },
  { id: 'ing-btl', code: 'BTL', name: 'Biskuit Lotus', category_id: 'c-7', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 100, is_active: true, cost_per_unit: 1500 },
  { id: 'ing-moc', code: 'MOC', name: 'Morin Chocolate', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 90 },
  { id: 'ing-mal', code: 'MAL', name: 'Marjan Leci', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-top', code: 'TOP', name: 'Toffico Peppermint', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 120 },
  { id: 'ing-fan', code: 'FAN', name: 'Fanta', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 15 },
  { id: 'ing-man', code: 'MAN', name: 'Marjan Nanas', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mas', code: 'MAS', name: 'Marjan Strawberry', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-mam', code: 'MAM', name: 'Marjan Mangga', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-pum', code: 'PUM', name: 'Pure Matcha', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 250 },
  { id: 'ing-tos', code: 'TOS', name: 'Toffico Strawberry Puree', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 120 },
  { id: 'ing-bul', code: 'BUL', name: 'Buah Leci', category_id: 'c-3', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 100, is_active: true, cost_per_unit: 2000 },
  { id: 'ing-crm', code: 'CRM', name: 'Crumble Matcha', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 90 },
  { id: 'ing-stw', code: 'STW', name: 'Strawberry Segar', category_id: 'c-3', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 100, is_active: true, cost_per_unit: 1500 },
  { id: 'ing-mal01', code: 'MAL01', name: 'Marjan Lemon', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-dib', code: 'DIB', name: 'Diamond Blueberry', category_id: 'c-7', unit_id: 'u-2', type: 'raw', min_stock: 200, current_stock: 1000, is_active: true, cost_per_unit: 100 },
  { id: 'ing-toc01', code: 'TOC01', name: 'Popping Candy', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 200 },
  { id: 'ing-tet', code: 'TET', name: 'Teh Telang', category_id: 'c-7', unit_id: 'u-1', type: 'raw', min_stock: 100, current_stock: 500, is_active: true, cost_per_unit: 100 },
  { id: 'ing-gua', code: 'GUA', name: 'Gula Aren Balok', category_id: 'c-4', unit_id: 'u-1', type: 'raw', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-egw', code: 'EGW', name: 'Egg White', category_id: 'c-1', unit_id: 'u-3', type: 'raw', min_stock: 20, current_stock: 100, is_active: true, cost_per_unit: 2000 },

  // Prepared Beverage Bases (PPB)
  { id: 'ing-ppb01', code: 'PPB01', name: 'PP Cold Brew', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 25 },
  { id: 'ing-ppb02', code: 'PPB02', name: 'PP Cream Cheese', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 60 },
  { id: 'ing-ppb03', code: 'PPB03', name: 'PP Kopsu Based', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 35 },
  { id: 'ing-ppb04', code: 'PPB04', name: 'PP Tea Based', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 10 },
  { id: 'ing-ppb05', code: 'PPB05', name: 'PP Simple Syrup', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 1000, current_stock: 5000, is_active: true, cost_per_unit: 15 },
  { id: 'ing-ppb06', code: 'PPB06', name: 'PP Butterfly Pea Based', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 20 },
  { id: 'ing-ppb07', code: 'PPB07', name: 'PP Palmsugar Based', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 40 },
  { id: 'ing-ppb08', code: 'PPB08', name: 'PP Kopsu Formula', category_id: 'c-5', unit_id: 'u-1', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 30 },
  { id: 'ing-ppb09', code: 'PPB09', name: 'PP Destilasi Dirty', category_id: 'c-5', unit_id: 'u-2', type: 'prepared', min_stock: 500, current_stock: 2000, is_active: true, cost_per_unit: 50 },
];

export const BEVERAGE_MENUS: Menu[] = [
  { id: 'mn-101', name: 'Cafe Latte Ice', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-102', name: 'Cafe Latte Hot', category: 'Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-103', name: 'Cappuccino Hot', category: 'Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-104', name: 'Moccacino Hot', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-105', name: 'Moccacino Iced', category: 'Coffee', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-106', name: 'Cappuccino Iced', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-107', name: 'Dirty Latte', category: 'Coffee', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-108', name: 'Americano Hot', category: 'Coffee', price: 22000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-109', name: 'Americano Iced', category: 'Coffee', price: 24000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-110', name: 'Cloudy Americano', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-111', name: 'Berries Americano', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-112', name: 'Honey Americano', category: 'Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-113', name: 'Caramel Latte Iced', category: 'Coffee', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-114', name: 'Vanilla Latte Iced', category: 'Coffee', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-115', name: 'Butterscotch Latte Iced', category: 'Coffee', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-116', name: 'Butterscotch Latte Hot', category: 'Coffee', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-117', name: 'Salted Caramel Latte', category: 'Coffee', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-118', name: 'Red Velvet Iced', category: 'Non-Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-119', name: 'Red Velvet Hot', category: 'Non-Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-120', name: 'Chocolate Iced', category: 'Non-Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-121', name: 'Chocolate Hot', category: 'Non-Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-122', name: 'Taro Iced', category: 'Non-Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-123', name: 'Taro Hot', category: 'Non-Coffee', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-124', name: 'Tiger Bomb', category: 'Signature', price: 35000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-125', name: 'Biscoff Cheese Cream', category: 'Signature', price: 35000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-126', name: 'Meca Brulee', category: 'Signature', price: 35000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-127', name: 'Mecamocha Creamy', category: 'Signature', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-128', name: 'Wild Lemon', category: 'Mocktail', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-129', name: 'Pinnamint', category: 'Mocktail', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-130', name: 'Berry Bliss', category: 'Mocktail', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-131', name: 'Violet Berry', category: 'Mocktail', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-132', name: 'Pineapple Lemon', category: 'Mocktail', price: 30000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-133', name: 'Matcha Classic Iced', category: 'Matcha', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-134', name: 'Matcha Classic Hot', category: 'Matcha', price: 26000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-135', name: 'Matcha Biscoff', category: 'Matcha', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-136', name: 'Matcha Strawberry', category: 'Matcha', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-137', name: 'Lychee Tea', category: 'Tea', price: 25000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-138', name: 'Matcha Cheese Cream', category: 'Matcha', price: 32000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-139', name: 'Strawberry Tea', category: 'Tea', price: 25000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-140', name: 'Lemon Tea Iced', category: 'Tea', price: 22000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-141', name: 'Hot Tea', category: 'Tea', price: 18000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-142', name: 'Lemon Tea Hot', category: 'Tea', price: 20000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-143', name: 'Ice Tea', category: 'Tea', price: 18000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-144', name: 'Mont Blanc', category: 'Signature', price: 35000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-145', name: 'Berry Cream Pop', category: 'Signature', price: 35000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-146', name: 'Vanilla Latte Hot', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-147', name: 'Caramel Latte Hot', category: 'Coffee', price: 28000, is_active: true, active_recipe_version: 1 },
  { id: 'mn-148', name: 'Caramel Macchiato', category: 'Coffee', price: 32000, is_active: true, active_recipe_version: 1 },

  // Prepared Formulations (Half-Finished PP)
  { id: 'mn-201', name: 'Formula PP Kopsu', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-202', name: 'Formula PP Simple Syrup', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-203', name: 'Formula PP Cream Cheese', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-204', name: 'Formula PP Tea Based', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-205', name: 'Formula PP Destilasi Dirty', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-206', name: 'Formula PP Cold Brew', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-207', name: 'Formula PP Butterfly Pea Based', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
  { id: 'mn-208', name: 'Formula PP Palmsugar Based', category: 'PP Formula', price: 0, is_active: true, active_recipe_version: 1 },
];

export const BEVERAGE_RECIPES: Recipe[] = [
  { id: 'rec-mn101', menu_id: 'mn-101', version: 1, is_active: true, notes: 'Cafe Latte Ice' },
  { id: 'rec-mn102', menu_id: 'mn-102', version: 1, is_active: true, notes: 'Cafe Latte Hot' },
  { id: 'rec-mn103', menu_id: 'mn-103', version: 1, is_active: true, notes: 'Cappuccino Hot' },
  { id: 'rec-mn104', menu_id: 'mn-104', version: 1, is_active: true, notes: 'Moccacino Hot' },
  { id: 'rec-mn105', menu_id: 'mn-105', version: 1, is_active: true, notes: 'Moccacino Iced' },
  { id: 'rec-mn106', menu_id: 'mn-106', version: 1, is_active: true, notes: 'Cappuccino Iced' },
  { id: 'rec-mn107', menu_id: 'mn-107', version: 1, is_active: true, notes: 'Dirty Latte' },
  { id: 'rec-mn108', menu_id: 'mn-108', version: 1, is_active: true, notes: 'Americano Hot' },
  { id: 'rec-mn109', menu_id: 'mn-109', version: 1, is_active: true, notes: 'Americano Iced' },
  { id: 'rec-mn110', menu_id: 'mn-110', version: 1, is_active: true, notes: 'Cloudy Americano' },
  { id: 'rec-mn111', menu_id: 'mn-111', version: 1, is_active: true, notes: 'Berries Americano' },
  { id: 'rec-mn112', menu_id: 'mn-112', version: 1, is_active: true, notes: 'Honey Americano' },
  { id: 'rec-mn113', menu_id: 'mn-113', version: 1, is_active: true, notes: 'Caramel Latte Iced' },
  { id: 'rec-mn114', menu_id: 'mn-114', version: 1, is_active: true, notes: 'Vanilla Latte Iced' },
  { id: 'rec-mn115', menu_id: 'mn-115', version: 1, is_active: true, notes: 'Butterscotch Latte Iced' },
  { id: 'rec-mn116', menu_id: 'mn-116', version: 1, is_active: true, notes: 'Butterscotch Latte Hot' },
  { id: 'rec-mn117', menu_id: 'mn-117', version: 1, is_active: true, notes: 'Salted Caramel Latte' },
  { id: 'rec-mn118', menu_id: 'mn-118', version: 1, is_active: true, notes: 'Red Velvet Iced' },
  { id: 'rec-mn119', menu_id: 'mn-119', version: 1, is_active: true, notes: 'Red Velvet Hot' },
  { id: 'rec-mn120', menu_id: 'mn-120', version: 1, is_active: true, notes: 'Chocolate Iced' },
  { id: 'rec-mn121', menu_id: 'mn-121', version: 1, is_active: true, notes: 'Chocolate Hot' },
  { id: 'rec-mn122', menu_id: 'mn-122', version: 1, is_active: true, notes: 'Taro Iced' },
  { id: 'rec-mn123', menu_id: 'mn-123', version: 1, is_active: true, notes: 'Taro Hot' },
  { id: 'rec-mn124', menu_id: 'mn-124', version: 1, is_active: true, notes: 'Tiger Bomb' },
  { id: 'rec-mn125', menu_id: 'mn-125', version: 1, is_active: true, notes: 'Biscoff Cheese Cream' },
  { id: 'rec-mn126', menu_id: 'mn-126', version: 1, is_active: true, notes: 'Meca Brulee' },
  { id: 'rec-mn127', menu_id: 'mn-127', version: 1, is_active: true, notes: 'Mecamocha Creamy' },
  { id: 'rec-mn128', menu_id: 'mn-128', version: 1, is_active: true, notes: 'Wild Lemon' },
  { id: 'rec-mn129', menu_id: 'mn-129', version: 1, is_active: true, notes: 'Pinnamint' },
  { id: 'rec-mn130', menu_id: 'mn-130', version: 1, is_active: true, notes: 'Berry Bliss' },
  { id: 'rec-mn131', menu_id: 'mn-131', version: 1, is_active: true, notes: 'Violet Berry' },
  { id: 'rec-mn132', menu_id: 'mn-132', version: 1, is_active: true, notes: 'Pineapple Lemon' },
  { id: 'rec-mn133', menu_id: 'mn-133', version: 1, is_active: true, notes: 'Matcha Classic Iced' },
  { id: 'rec-mn134', menu_id: 'mn-134', version: 1, is_active: true, notes: 'Matcha Classic Hot' },
  { id: 'rec-mn135', menu_id: 'mn-135', version: 1, is_active: true, notes: 'Matcha Biscoff' },
  { id: 'rec-mn136', menu_id: 'mn-136', version: 1, is_active: true, notes: 'Matcha Strawberry' },
  { id: 'rec-mn137', menu_id: 'mn-137', version: 1, is_active: true, notes: 'Lychee Tea' },
  { id: 'rec-mn138', menu_id: 'mn-138', version: 1, is_active: true, notes: 'Matcha Cheese Cream' },
  { id: 'rec-mn139', menu_id: 'mn-139', version: 1, is_active: true, notes: 'Strawberry Tea' },
  { id: 'rec-mn140', menu_id: 'mn-140', version: 1, is_active: true, notes: 'Lemon Tea Iced' },
  { id: 'rec-mn141', menu_id: 'mn-141', version: 1, is_active: true, notes: 'Hot Tea' },
  { id: 'rec-mn142', menu_id: 'mn-142', version: 1, is_active: true, notes: 'Lemon Tea Hot' },
  { id: 'rec-mn143', menu_id: 'mn-143', version: 1, is_active: true, notes: 'Ice Tea' },
  { id: 'rec-mn144', menu_id: 'mn-144', version: 1, is_active: true, notes: 'Mont Blanc' },
  { id: 'rec-mn145', menu_id: 'mn-145', version: 1, is_active: true, notes: 'Berry Cream Pop' },
  { id: 'rec-mn146', menu_id: 'mn-146', version: 1, is_active: true, notes: 'Vanilla Latte Hot' },
  { id: 'rec-mn147', menu_id: 'mn-147', version: 1, is_active: true, notes: 'Caramel Latte Hot' },
  { id: 'rec-mn148', menu_id: 'mn-148', version: 1, is_active: true, notes: 'Caramel Macchiato' },

  // Prepared Recipes
  { id: 'rec-mn201', menu_id: 'mn-201', version: 1, is_active: true, notes: 'Formula PP Kopsu' },
  { id: 'rec-mn202', menu_id: 'mn-202', version: 1, is_active: true, notes: 'Formula PP Simple Syrup' },
  { id: 'rec-mn203', menu_id: 'mn-203', version: 1, is_active: true, notes: 'Formula PP Cream Cheese' },
  { id: 'rec-mn204', menu_id: 'mn-204', version: 1, is_active: true, notes: 'Formula PP Tea Based' },
  { id: 'rec-mn205', menu_id: 'mn-205', version: 1, is_active: true, notes: 'Formula PP Destilasi Dirty' },
  { id: 'rec-mn206', menu_id: 'mn-206', version: 1, is_active: true, notes: 'Formula PP Cold Brew' },
  { id: 'rec-mn207', menu_id: 'mn-207', version: 1, is_active: true, notes: 'Formula PP Butterfly Pea Based' },
  { id: 'rec-mn208', menu_id: 'mn-208', version: 1, is_active: true, notes: 'Formula PP Palmsugar Based' },
];

export const BEVERAGE_RECIPE_DETAILS: RecipeDetail[] = [
  // MN101: Cafe Latte Ice
  { id: 'rd-b101-1', recipe_id: 'rec-mn101', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b101-2', recipe_id: 'rec-mn101', ingredient_id: 'ing-kri', quantity: 5 },
  { id: 'rd-b101-3', recipe_id: 'rec-mn101', ingredient_id: 'ing-ppb05', quantity: 20 },
  { id: 'rd-b101-4', recipe_id: 'rec-mn101', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b101-5', recipe_id: 'rec-mn101', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b101-6', recipe_id: 'rec-mn101', ingredient_id: 'ing-cul', quantity: 1 },

  // MN102: Cafe Latte Hot
  { id: 'rd-b102-1', recipe_id: 'rec-mn102', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b102-2', recipe_id: 'rec-mn102', ingredient_id: 'ing-ppb05', quantity: 20 },
  { id: 'rd-b102-3', recipe_id: 'rec-mn102', ingredient_id: 'ing-frm', quantity: 210 },

  // MN103: Cappuccino Hot
  { id: 'rd-b103-1', recipe_id: 'rec-mn103', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b103-2', recipe_id: 'rec-mn103', ingredient_id: 'ing-ppb05', quantity: 20 },
  { id: 'rd-b103-3', recipe_id: 'rec-mn103', ingredient_id: 'ing-frm', quantity: 210 },

  // MN104: Moccacino Hot
  { id: 'rd-b104-1', recipe_id: 'rec-mn104', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b104-2', recipe_id: 'rec-mn104', ingredient_id: 'ing-acp', quantity: 5 },
  { id: 'rd-b104-3', recipe_id: 'rec-mn104', ingredient_id: 'ing-gre', quantity: 195 },
  { id: 'rd-b104-4', recipe_id: 'rec-mn104', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b104-5', recipe_id: 'rec-mn104', ingredient_id: 'ing-ppb03', quantity: 5 },

  // MN105: Moccacino Iced
  { id: 'rd-b105-1', recipe_id: 'rec-mn105', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b105-2', recipe_id: 'rec-mn105', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b105-3', recipe_id: 'rec-mn105', ingredient_id: 'ing-ppb03', quantity: 120 },
  { id: 'rd-b105-4', recipe_id: 'rec-mn105', ingredient_id: 'ing-acp', quantity: 10 },
  { id: 'rd-b105-5', recipe_id: 'rec-mn105', ingredient_id: 'ing-gac', quantity: 5 },
  { id: 'rd-b105-6', recipe_id: 'rec-mn105', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b105-7', recipe_id: 'rec-mn105', ingredient_id: 'ing-ppb05', quantity: 20 },

  // MN106: Cappuccino Iced
  { id: 'rd-b106-1', recipe_id: 'rec-mn106', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b106-2', recipe_id: 'rec-mn106', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b106-3', recipe_id: 'rec-mn106', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b106-4', recipe_id: 'rec-mn106', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b106-5', recipe_id: 'rec-mn106', ingredient_id: 'ing-ppb05', quantity: 20 },

  // MN107: Dirty Latte
  { id: 'rd-b107-1', recipe_id: 'rec-mn107', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b107-2', recipe_id: 'rec-mn107', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b107-3', recipe_id: 'rec-mn107', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b107-4', recipe_id: 'rec-mn107', ingredient_id: 'ing-shi', quantity: 60 },
  { id: 'rd-b107-5', recipe_id: 'rec-mn107', ingredient_id: 'ing-ses', quantity: 1 },
  { id: 'rd-b107-6', recipe_id: 'rec-mn107', ingredient_id: 'ing-gre', quantity: 60 },

  // MN108: Americano Hot
  { id: 'rd-b108-1', recipe_id: 'rec-mn108', ingredient_id: 'ing-gac', quantity: 210 },
  { id: 'rd-b108-2', recipe_id: 'rec-mn108', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b108-3', recipe_id: 'rec-mn108', ingredient_id: 'ing-ppb05', quantity: 20 },

  // MN109: Americano Iced
  { id: 'rd-b109-1', recipe_id: 'rec-mn109', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b109-2', recipe_id: 'rec-mn109', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b109-3', recipe_id: 'rec-mn109', ingredient_id: 'ing-gac', quantity: 210 },
  { id: 'rd-b109-4', recipe_id: 'rec-mn109', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b109-5', recipe_id: 'rec-mn109', ingredient_id: 'ing-ppb05', quantity: 20 },

  // MN110: Cloudy Americano
  { id: 'rd-b110-1', recipe_id: 'rec-mn110', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b110-2', recipe_id: 'rec-mn110', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b110-3', recipe_id: 'rec-mn110', ingredient_id: 'ing-gac', quantity: 120 },
  { id: 'rd-b110-4', recipe_id: 'rec-mn110', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b110-5', recipe_id: 'rec-mn110', ingredient_id: 'ing-hou', quantity: 9.1 },

  // MN111: Berries Americano
  { id: 'rd-b111-1', recipe_id: 'rec-mn111', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b111-2', recipe_id: 'rec-mn111', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b111-3', recipe_id: 'rec-mn111', ingredient_id: 'ing-gac', quantity: 120 },
  { id: 'rd-b111-4', recipe_id: 'rec-mn111', ingredient_id: 'ing-mib', quantity: 20 },
  { id: 'rd-b111-5', recipe_id: 'rec-mn111', ingredient_id: 'ing-hou', quantity: 9.1 },

  // MN112: Honey Americano
  { id: 'rd-b112-1', recipe_id: 'rec-mn112', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b112-2', recipe_id: 'rec-mn112', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b112-3', recipe_id: 'rec-mn112', ingredient_id: 'ing-gac', quantity: 120 },
  { id: 'rd-b112-4', recipe_id: 'rec-mn112', ingredient_id: 'ing-mat', quantity: 20 },
  { id: 'rd-b112-5', recipe_id: 'rec-mn112', ingredient_id: 'ing-hou', quantity: 9.1 },

  // MN113: Caramel Latte Iced
  { id: 'rd-b113-1', recipe_id: 'rec-mn113', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b113-2', recipe_id: 'rec-mn113', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b113-3', recipe_id: 'rec-mn113', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b113-4', recipe_id: 'rec-mn113', ingredient_id: 'ing-toc', quantity: 15 },
  { id: 'rd-b113-5', recipe_id: 'rec-mn113', ingredient_id: 'ing-kri', quantity: 5 },
  { id: 'rd-b113-6', recipe_id: 'rec-mn113', ingredient_id: 'ing-frm', quantity: 120 },

  // MN114: Vanilla Latte Iced
  { id: 'rd-b114-1', recipe_id: 'rec-mn114', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b114-2', recipe_id: 'rec-mn114', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b114-3', recipe_id: 'rec-mn114', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b114-4', recipe_id: 'rec-mn114', ingredient_id: 'ing-mav', quantity: 20 },
  { id: 'rd-b114-5', recipe_id: 'rec-mn114', ingredient_id: 'ing-kri', quantity: 5 },
  { id: 'rd-b114-6', recipe_id: 'rec-mn114', ingredient_id: 'ing-frm', quantity: 120 },

  // MN115: Butterscotch Latte Iced
  { id: 'rd-b115-1', recipe_id: 'rec-mn115', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b115-2', recipe_id: 'rec-mn115', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b115-3', recipe_id: 'rec-mn115', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b115-4', recipe_id: 'rec-mn115', ingredient_id: 'ing-tob', quantity: 20 },
  { id: 'rd-b115-5', recipe_id: 'rec-mn115', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b115-6', recipe_id: 'rec-mn115', ingredient_id: 'ing-kri', quantity: 5 },

  // MN116: Butterscotch Latte Hot
  { id: 'rd-b116-1', recipe_id: 'rec-mn116', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b116-2', recipe_id: 'rec-mn116', ingredient_id: 'ing-mav', quantity: 10 },
  { id: 'rd-b116-3', recipe_id: 'rec-mn116', ingredient_id: 'ing-gre', quantity: 210 },

  // MN117: Salted Caramel Latte
  { id: 'rd-b117-1', recipe_id: 'rec-mn117', ingredient_id: 'ing-gre', quantity: 210 },
  { id: 'rd-b117-2', recipe_id: 'rec-mn117', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b117-3', recipe_id: 'rec-mn117', ingredient_id: 'ing-sct', quantity: 5 },
  { id: 'rd-b117-4', recipe_id: 'rec-mn117', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b117-5', recipe_id: 'rec-mn117', ingredient_id: 'ing-shi', quantity: 10 },
  { id: 'rd-b117-6', recipe_id: 'rec-mn117', ingredient_id: 'ing-kri', quantity: 5 },
  { id: 'rd-b117-7', recipe_id: 'rec-mn117', ingredient_id: 'ing-drc', quantity: 1 },

  // MN118: Red Velvet Iced
  { id: 'rd-b118-1', recipe_id: 'rec-mn118', ingredient_id: 'ing-arv', quantity: 20 },
  { id: 'rd-b118-2', recipe_id: 'rec-mn118', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b118-3', recipe_id: 'rec-mn118', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b118-4', recipe_id: 'rec-mn118', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b118-5', recipe_id: 'rec-mn118', ingredient_id: 'ing-cul', quantity: 1 },

  // MN119: Red Velvet Hot
  { id: 'rd-b119-1', recipe_id: 'rec-mn119', ingredient_id: 'ing-arv', quantity: 15 },
  { id: 'rd-b119-2', recipe_id: 'rec-mn119', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b119-3', recipe_id: 'rec-mn119', ingredient_id: 'ing-frm', quantity: 210 },

  // MN120: Chocolate Iced
  { id: 'rd-b120-1', recipe_id: 'rec-mn120', ingredient_id: 'ing-acp', quantity: 20 },
  { id: 'rd-b120-2', recipe_id: 'rec-mn120', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b120-3', recipe_id: 'rec-mn120', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b120-4', recipe_id: 'rec-mn120', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b120-5', recipe_id: 'rec-mn120', ingredient_id: 'ing-cul', quantity: 1 },

  // MN121: Chocolate Hot
  { id: 'rd-b121-1', recipe_id: 'rec-mn121', ingredient_id: 'ing-acp', quantity: 15 },
  { id: 'rd-b121-2', recipe_id: 'rec-mn121', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b121-3', recipe_id: 'rec-mn121', ingredient_id: 'ing-gre', quantity: 210 },

  // MN122: Taro Iced
  { id: 'rd-b122-1', recipe_id: 'rec-mn122', ingredient_id: 'ing-ast', quantity: 20 },
  { id: 'rd-b122-2', recipe_id: 'rec-mn122', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b122-3', recipe_id: 'rec-mn122', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b122-4', recipe_id: 'rec-mn122', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b122-5', recipe_id: 'rec-mn122', ingredient_id: 'ing-cul', quantity: 1 },

  // MN123: Taro Hot
  { id: 'rd-b123-1', recipe_id: 'rec-mn123', ingredient_id: 'ing-ast', quantity: 15 },
  { id: 'rd-b123-2', recipe_id: 'rec-mn123', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b123-3', recipe_id: 'rec-mn123', ingredient_id: 'ing-frm', quantity: 210 },

  // MN124: Tiger Bomb
  { id: 'rd-b124-1', recipe_id: 'rec-mn124', ingredient_id: 'ing-san', quantity: 5 },
  { id: 'rd-b124-2', recipe_id: 'rec-mn124', ingredient_id: 'ing-shi', quantity: 15 },
  { id: 'rd-b124-3', recipe_id: 'rec-mn124', ingredient_id: 'ing-skg', quantity: 10 },
  { id: 'rd-b124-4', recipe_id: 'rec-mn124', ingredient_id: 'ing-gre', quantity: 120 },
  { id: 'rd-b124-5', recipe_id: 'rec-mn124', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b124-6', recipe_id: 'rec-mn124', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b124-7', recipe_id: 'rec-mn124', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b124-8', recipe_id: 'rec-mn124', ingredient_id: 'ing-cul', quantity: 1 },

  // MN125: Biscoff Cheese Cream
  { id: 'rd-b125-1', recipe_id: 'rec-mn125', ingredient_id: 'ing-tob', quantity: 15 },
  { id: 'rd-b125-2', recipe_id: 'rec-mn125', ingredient_id: 'ing-sct', quantity: 5 },
  { id: 'rd-b125-3', recipe_id: 'rec-mn125', ingredient_id: 'ing-ppb03', quantity: 120 },
  { id: 'rd-b125-4', recipe_id: 'rec-mn125', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b125-5', recipe_id: 'rec-mn125', ingredient_id: 'ing-crc', quantity: 3 },
  { id: 'rd-b125-6', recipe_id: 'rec-mn125', ingredient_id: 'ing-btl', quantity: 1 },
  { id: 'rd-b125-7', recipe_id: 'rec-mn125', ingredient_id: 'ing-ses', quantity: 0.3 },
  { id: 'rd-b125-8', recipe_id: 'rec-mn125', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b125-9', recipe_id: 'rec-mn125', ingredient_id: 'ing-cul', quantity: 1 },

  // MN126: Meca Brulee
  { id: 'rd-b126-1', recipe_id: 'rec-mn126', ingredient_id: 'ing-tob', quantity: 15 },
  { id: 'rd-b126-2', recipe_id: 'rec-mn126', ingredient_id: 'ing-ppb07', quantity: 5 },
  { id: 'rd-b126-3', recipe_id: 'rec-mn126', ingredient_id: 'ing-moc', quantity: 5 },
  { id: 'rd-b126-4', recipe_id: 'rec-mn126', ingredient_id: 'ing-ppb03', quantity: 120 },
  { id: 'rd-b126-5', recipe_id: 'rec-mn126', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b126-6', recipe_id: 'rec-mn126', ingredient_id: 'ing-ses', quantity: 0.3 },
  { id: 'rd-b126-7', recipe_id: 'rec-mn126', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b126-8', recipe_id: 'rec-mn126', ingredient_id: 'ing-cul', quantity: 1 },

  // MN127: Mecamocha Creamy
  { id: 'rd-b127-1', recipe_id: 'rec-mn127', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b127-2', recipe_id: 'rec-mn127', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b127-3', recipe_id: 'rec-mn127', ingredient_id: 'ing-ppb07', quantity: 20 },
  { id: 'rd-b127-4', recipe_id: 'rec-mn127', ingredient_id: 'ing-ppb03', quantity: 120 },

  // MN128: Wild Lemon
  { id: 'rd-b128-1', recipe_id: 'rec-mn128', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b128-2', recipe_id: 'rec-mn128', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b128-3', recipe_id: 'rec-mn128', ingredient_id: 'ing-mal', quantity: 20 },
  { id: 'rd-b128-4', recipe_id: 'rec-mn128', ingredient_id: 'ing-top', quantity: 20 },
  { id: 'rd-b128-5', recipe_id: 'rec-mn128', ingredient_id: 'ing-hou', quantity: 20 },
  { id: 'rd-b128-6', recipe_id: 'rec-mn128', ingredient_id: 'ing-ses', quantity: 1 },
  { id: 'rd-b128-7', recipe_id: 'rec-mn128', ingredient_id: 'ing-fan', quantity: 120 },

  // MN129: Pinnamint
  { id: 'rd-b129-1', recipe_id: 'rec-mn129', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b129-2', recipe_id: 'rec-mn129', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b129-3', recipe_id: 'rec-mn129', ingredient_id: 'ing-man', quantity: 20 },
  { id: 'rd-b129-4', recipe_id: 'rec-mn129', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b129-5', recipe_id: 'rec-mn129', ingredient_id: 'ing-mal', quantity: 20 },
  { id: 'rd-b129-6', recipe_id: 'rec-mn129', ingredient_id: 'ing-top', quantity: 10 },
  { id: 'rd-b129-7', recipe_id: 'rec-mn129', ingredient_id: 'ing-fan', quantity: 110 },

  // MN130: Berry Bliss
  { id: 'rd-b130-1', recipe_id: 'rec-mn130', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b130-2', recipe_id: 'rec-mn130', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b130-3', recipe_id: 'rec-mn130', ingredient_id: 'ing-mas', quantity: 20 },
  { id: 'rd-b130-4', recipe_id: 'rec-mn130', ingredient_id: 'ing-mam', quantity: 20 },
  { id: 'rd-b130-5', recipe_id: 'rec-mn130', ingredient_id: 'ing-mav', quantity: 10 },
  { id: 'rd-b130-6', recipe_id: 'rec-mn130', ingredient_id: 'ing-gac', quantity: 110 },
  { id: 'rd-b130-7', recipe_id: 'rec-mn130', ingredient_id: 'ing-egw', quantity: 5 },

  // MN131: Violet Berry
  { id: 'rd-b131-1', recipe_id: 'rec-mn131', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b131-2', recipe_id: 'rec-mn131', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b131-3', recipe_id: 'rec-mn131', ingredient_id: 'ing-mas', quantity: 20 },
  { id: 'rd-b131-4', recipe_id: 'rec-mn131', ingredient_id: 'ing-mal', quantity: 20 },
  { id: 'rd-b131-5', recipe_id: 'rec-mn131', ingredient_id: 'ing-ppb06', quantity: 30 },
  { id: 'rd-b131-6', recipe_id: 'rec-mn131', ingredient_id: 'ing-gac', quantity: 110 },
  { id: 'rd-b131-7', recipe_id: 'rec-mn131', ingredient_id: 'ing-egw', quantity: 5 },

  // MN132: Pineapple Lemon
  { id: 'rd-b132-1', recipe_id: 'rec-mn132', ingredient_id: 'ing-man', quantity: 20 },
  { id: 'rd-b132-2', recipe_id: 'rec-mn132', ingredient_id: 'ing-mal', quantity: 20 },
  { id: 'rd-b132-3', recipe_id: 'rec-mn132', ingredient_id: 'ing-top', quantity: 10 },
  { id: 'rd-b132-4', recipe_id: 'rec-mn132', ingredient_id: 'ing-ppb04', quantity: 30 },
  { id: 'rd-b132-5', recipe_id: 'rec-mn132', ingredient_id: 'ing-gac', quantity: 110 },
  { id: 'rd-b132-6', recipe_id: 'rec-mn132', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b132-7', recipe_id: 'rec-mn132', ingredient_id: 'ing-cul', quantity: 1 },

  // MN133: Matcha Classic Iced
  { id: 'rd-b133-1', recipe_id: 'rec-mn133', ingredient_id: 'ing-pum', quantity: 3 },
  { id: 'rd-b133-2', recipe_id: 'rec-mn133', ingredient_id: 'ing-skg', quantity: 10 },
  { id: 'rd-b133-3', recipe_id: 'rec-mn133', ingredient_id: 'ing-gac', quantity: 15 },
  { id: 'rd-b133-4', recipe_id: 'rec-mn133', ingredient_id: 'ing-gre', quantity: 120 },
  { id: 'rd-b133-5', recipe_id: 'rec-mn133', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b133-6', recipe_id: 'rec-mn133', ingredient_id: 'ing-cul', quantity: 1 },

  // MN134: Matcha Classic Hot
  { id: 'rd-b134-1', recipe_id: 'rec-mn134', ingredient_id: 'ing-pum', quantity: 3 },
  { id: 'rd-b134-2', recipe_id: 'rec-mn134', ingredient_id: 'ing-skg', quantity: 5 },
  { id: 'rd-b134-3', recipe_id: 'rec-mn134', ingredient_id: 'ing-gac', quantity: 15 },
  { id: 'rd-b134-4', recipe_id: 'rec-mn134', ingredient_id: 'ing-gre', quantity: 210 },

  // MN135: Matcha Biscoff
  { id: 'rd-b135-1', recipe_id: 'rec-mn135', ingredient_id: 'ing-pum', quantity: 3 },
  { id: 'rd-b135-2', recipe_id: 'rec-mn135', ingredient_id: 'ing-tob', quantity: 15 },
  { id: 'rd-b135-3', recipe_id: 'rec-mn135', ingredient_id: 'ing-sct', quantity: 5 },
  { id: 'rd-b135-4', recipe_id: 'rec-mn135', ingredient_id: 'ing-gac', quantity: 15 },
  { id: 'rd-b135-5', recipe_id: 'rec-mn135', ingredient_id: 'ing-crc', quantity: 3 },
  { id: 'rd-b135-6', recipe_id: 'rec-mn135', ingredient_id: 'ing-btl', quantity: 0.5 },
  { id: 'rd-b135-7', recipe_id: 'rec-mn135', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b135-8', recipe_id: 'rec-mn135', ingredient_id: 'ing-gre', quantity: 120 },
  { id: 'rd-b135-9', recipe_id: 'rec-mn135', ingredient_id: 'ing-ses', quantity: 0.3 },
  { id: 'rd-b135-10', recipe_id: 'rec-mn135', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b135-11', recipe_id: 'rec-mn135', ingredient_id: 'ing-cul', quantity: 1 },

  // MN136: Matcha Strawberry
  { id: 'rd-b136-1', recipe_id: 'rec-mn136', ingredient_id: 'ing-pum', quantity: 3 },
  { id: 'rd-b136-2', recipe_id: 'rec-mn136', ingredient_id: 'ing-tos', quantity: 15 },
  { id: 'rd-b136-3', recipe_id: 'rec-mn136', ingredient_id: 'ing-gac', quantity: 15 },
  { id: 'rd-b136-4', recipe_id: 'rec-mn136', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b136-5', recipe_id: 'rec-mn136', ingredient_id: 'ing-crc', quantity: 3 },
  { id: 'rd-b136-6', recipe_id: 'rec-mn136', ingredient_id: 'ing-gre', quantity: 120 },
  { id: 'rd-b136-7', recipe_id: 'rec-mn136', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b136-8', recipe_id: 'rec-mn136', ingredient_id: 'ing-cul', quantity: 1 },

  // MN137: Lychee Tea
  { id: 'rd-b137-1', recipe_id: 'rec-mn137', ingredient_id: 'ing-mal', quantity: 10 },
  { id: 'rd-b137-2', recipe_id: 'rec-mn137', ingredient_id: 'ing-ppb05', quantity: 10 },
  { id: 'rd-b137-3', recipe_id: 'rec-mn137', ingredient_id: 'ing-ppb06', quantity: 120 },
  { id: 'rd-b137-4', recipe_id: 'rec-mn137', ingredient_id: 'ing-bul', quantity: 1 },
  { id: 'rd-b137-5', recipe_id: 'rec-mn137', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b137-6', recipe_id: 'rec-mn137', ingredient_id: 'ing-cul', quantity: 1 },

  // MN138: Matcha Cheese Cream
  { id: 'rd-b138-1', recipe_id: 'rec-mn138', ingredient_id: 'ing-pum', quantity: 3 },
  { id: 'rd-b138-2', recipe_id: 'rec-mn138', ingredient_id: 'ing-drc', quantity: 5 },
  { id: 'rd-b138-3', recipe_id: 'rec-mn138', ingredient_id: 'ing-gac', quantity: 15 },
  { id: 'rd-b138-4', recipe_id: 'rec-mn138', ingredient_id: 'ing-gre', quantity: 120 },
  { id: 'rd-b138-5', recipe_id: 'rec-mn138', ingredient_id: 'ing-skg', quantity: 10 },
  { id: 'rd-b138-6', recipe_id: 'rec-mn138', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b138-7', recipe_id: 'rec-mn138', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b138-8', recipe_id: 'rec-mn138', ingredient_id: 'ing-crm', quantity: 3 },
  { id: 'rd-b138-9', recipe_id: 'rec-mn138', ingredient_id: 'ing-ppb02', quantity: 20 },

  // MN139: Strawberry Tea
  { id: 'rd-b139-1', recipe_id: 'rec-mn139', ingredient_id: 'ing-tos', quantity: 10 },
  { id: 'rd-b139-2', recipe_id: 'rec-mn139', ingredient_id: 'ing-ppb05', quantity: 10 },
  { id: 'rd-b139-3', recipe_id: 'rec-mn139', ingredient_id: 'ing-ppb04', quantity: 120 },
  { id: 'rd-b139-4', recipe_id: 'rec-mn139', ingredient_id: 'ing-stw', quantity: 1 },
  { id: 'rd-b139-5', recipe_id: 'rec-mn139', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b139-6', recipe_id: 'rec-mn139', ingredient_id: 'ing-cul', quantity: 1 },

  // MN140: Lemon Tea Iced
  { id: 'rd-b140-1', recipe_id: 'rec-mn140', ingredient_id: 'ing-mal01', quantity: 20 },
  { id: 'rd-b140-2', recipe_id: 'rec-mn140', ingredient_id: 'ing-ppb04', quantity: 120 },
  { id: 'rd-b140-3', recipe_id: 'rec-mn140', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b140-4', recipe_id: 'rec-mn140', ingredient_id: 'ing-cul', quantity: 1 },

  // MN141: Hot Tea
  { id: 'rd-b141-1', recipe_id: 'rec-mn141', ingredient_id: 'ing-ppb04', quantity: 50 },
  { id: 'rd-b141-2', recipe_id: 'rec-mn141', ingredient_id: 'ing-gac', quantity: 180 },
  { id: 'rd-b141-3', recipe_id: 'rec-mn141', ingredient_id: 'ing-ppb05', quantity: 20 },

  // MN142: Lemon Tea Hot
  { id: 'rd-b142-1', recipe_id: 'rec-mn142', ingredient_id: 'ing-mal', quantity: 20 },
  { id: 'rd-b142-2', recipe_id: 'rec-mn142', ingredient_id: 'ing-gac', quantity: 100 },
  { id: 'rd-b142-3', recipe_id: 'rec-mn142', ingredient_id: 'ing-ppb04', quantity: 100 },

  // MN143: Ice Tea
  { id: 'rd-b143-1', recipe_id: 'rec-mn143', ingredient_id: 'ing-ppb04', quantity: 120 },
  { id: 'rd-b143-2', recipe_id: 'rec-mn143', ingredient_id: 'ing-ppb05', quantity: 30 },
  { id: 'rd-b143-3', recipe_id: 'rec-mn143', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b143-4', recipe_id: 'rec-mn143', ingredient_id: 'ing-cul', quantity: 1 },

  // MN144: Mont Blanc
  { id: 'rd-b144-1', recipe_id: 'rec-mn144', ingredient_id: 'ing-ppb01', quantity: 120 },
  { id: 'rd-b144-2', recipe_id: 'rec-mn144', ingredient_id: 'ing-san', quantity: 25 },
  { id: 'rd-b144-3', recipe_id: 'rec-mn144', ingredient_id: 'ing-mav', quantity: 5 },
  { id: 'rd-b144-4', recipe_id: 'rec-mn144', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b144-5', recipe_id: 'rec-mn144', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b144-6', recipe_id: 'rec-mn144', ingredient_id: 'ing-cul', quantity: 1 },

  // MN145: Berry Cream Pop
  { id: 'rd-b145-1', recipe_id: 'rec-mn145', ingredient_id: 'ing-mav', quantity: 10 },
  { id: 'rd-b145-2', recipe_id: 'rec-mn145', ingredient_id: 'ing-dib', quantity: 10 },
  { id: 'rd-b145-3', recipe_id: 'rec-mn145', ingredient_id: 'ing-mib', quantity: 10 },
  { id: 'rd-b145-4', recipe_id: 'rec-mn145', ingredient_id: 'ing-ppb01', quantity: 100 },
  { id: 'rd-b145-5', recipe_id: 'rec-mn145', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b145-6', recipe_id: 'rec-mn145', ingredient_id: 'ing-toc01', quantity: 1 },
  { id: 'rd-b145-7', recipe_id: 'rec-mn145', ingredient_id: 'ing-cui', quantity: 1 },
  { id: 'rd-b145-8', recipe_id: 'rec-mn145', ingredient_id: 'ing-cul', quantity: 1 },

  // MN146: Vanilla Latte Hot
  { id: 'rd-b146-1', recipe_id: 'rec-mn146', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b146-2', recipe_id: 'rec-mn146', ingredient_id: 'ing-mav', quantity: 10 },
  { id: 'rd-b146-3', recipe_id: 'rec-mn146', ingredient_id: 'ing-gre', quantity: 210 },

  // MN147: Caramel Latte Hot
  { id: 'rd-b147-1', recipe_id: 'rec-mn147', ingredient_id: 'ing-hou', quantity: 9.1 },
  { id: 'rd-b147-2', recipe_id: 'rec-mn147', ingredient_id: 'ing-toc', quantity: 10 },
  { id: 'rd-b147-3', recipe_id: 'rec-mn147', ingredient_id: 'ing-gre', quantity: 210 },

  // MN148: Caramel Macchiato
  { id: 'rd-b148-1', recipe_id: 'rec-mn148', ingredient_id: 'ing-hou', quantity: 18.2 },
  { id: 'rd-b148-2', recipe_id: 'rec-mn148', ingredient_id: 'ing-mav', quantity: 20 },
  { id: 'rd-b148-3', recipe_id: 'rec-mn148', ingredient_id: 'ing-sct', quantity: 10 },
  { id: 'rd-b148-4', recipe_id: 'rec-mn148', ingredient_id: 'ing-frm', quantity: 120 },
  { id: 'rd-b148-5', recipe_id: 'rec-mn148', ingredient_id: 'ing-crc', quantity: 3 },
  { id: 'rd-b148-6', recipe_id: 'rec-mn148', ingredient_id: 'ing-ppb02', quantity: 20 },
  { id: 'rd-b148-7', recipe_id: 'rec-mn148', ingredient_id: 'ing-cul', quantity: 1 },
  { id: 'rd-b148-8', recipe_id: 'rec-mn148', ingredient_id: 'ing-cui', quantity: 1 },

  // MN201: Formula PP Kopsu
  { id: 'rd-b201-1', recipe_id: 'rec-mn201', ingredient_id: 'ing-kri', quantity: 25 },
  { id: 'rd-b201-2', recipe_id: 'rec-mn201', ingredient_id: 'ing-frm', quantity: 2850 },
  { id: 'rd-b201-3', recipe_id: 'rec-mn201', ingredient_id: 'ing-hou', quantity: 250 },

  // MN202: Formula PP Simple Syrup
  { id: 'rd-b202-1', recipe_id: 'rec-mn202', ingredient_id: 'ing-whs', quantity: 1000 },
  { id: 'rd-b202-2', recipe_id: 'rec-mn202', ingredient_id: 'ing-gaf', quantity: 800 },

  // MN203: Formula PP Cream Cheese
  { id: 'rd-b203-1', recipe_id: 'rec-mn203', ingredient_id: 'ing-drc', quantity: 10 },
  { id: 'rd-b203-2', recipe_id: 'rec-mn203', ingredient_id: 'ing-shi', quantity: 800 },
  { id: 'rd-b203-3', recipe_id: 'rec-mn203', ingredient_id: 'ing-ses', quantity: 2 },

  // MN204: Formula PP Tea Based
  { id: 'rd-b204-1', recipe_id: 'rec-mn204', ingredient_id: 'ing-tep', quantity: 13 },
  { id: 'rd-b204-2', recipe_id: 'rec-mn204', ingredient_id: 'ing-teg', quantity: 13 },
  { id: 'rd-b204-3', recipe_id: 'rec-mn204', ingredient_id: 'ing-ted', quantity: 13 },
  { id: 'rd-b204-4', recipe_id: 'rec-mn204', ingredient_id: 'ing-tej', quantity: 13 },
  { id: 'rd-b204-5', recipe_id: 'rec-mn204', ingredient_id: 'ing-gac', quantity: 2000 },

  // MN205: Formula PP Destilasi Dirty
  { id: 'rd-b205-1', recipe_id: 'rec-mn205', ingredient_id: 'ing-shi', quantity: 300 },
  { id: 'rd-b205-2', recipe_id: 'rec-mn205', ingredient_id: 'ing-gre', quantity: 300 },
  { id: 'rd-b205-3', recipe_id: 'rec-mn205', ingredient_id: 'ing-ses', quantity: 1 },

  // MN206: Formula PP Cold Brew
  { id: 'rd-b206-1', recipe_id: 'rec-mn206', ingredient_id: 'ing-hou', quantity: 55 },
  { id: 'rd-b206-2', recipe_id: 'rec-mn206', ingredient_id: 'ing-gac', quantity: 1500 },

  // MN207: Formula PP Butterfly Pea Based
  { id: 'rd-b207-1', recipe_id: 'rec-mn207', ingredient_id: 'ing-tet', quantity: 3 },
  { id: 'rd-b207-2', recipe_id: 'rec-mn207', ingredient_id: 'ing-gac', quantity: 250 },

  // MN208: Formula PP Palmsugar Based
  { id: 'rd-b208-1', recipe_id: 'rec-mn208', ingredient_id: 'ing-gua', quantity: 500 },
  { id: 'rd-b208-2', recipe_id: 'rec-mn208', ingredient_id: 'ing-gac', quantity: 250 },
];
