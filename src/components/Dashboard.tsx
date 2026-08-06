import React from 'react';
import {
  Boxes,
  UtensilsCrossed,
  ArrowRightLeft,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  ChefHat,
  Plus,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatNumber, formatDate } from '../utils/formatters';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  onOpenQuickAction: (action: 'purchase' | 'prepare' | 'production' | 'adjustment') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenQuickAction }) => {
  const { ingredients, menus, transactions, units, categories } = useInventory();

  // Metrics
  const totalIngredients = ingredients.filter((i) => i.is_active).length;
  const rawIngredientsCount = ingredients.filter((i) => i.is_active && i.type === 'raw').length;
  const preparedIngredientsCount = ingredients.filter((i) => i.is_active && i.type === 'prepared').length;
  const totalMenus = menus.filter((m) => m.is_active).length;

  const todayStr = new Date().toDateString();
  const todayTransactions = transactions.filter(
    (t) => new Date(t.transaction_date).toDateString() === todayStr
  );

  // Critical Stock Items (current_stock <= min_stock)
  const criticalItems = ingredients.filter(
    (i) => i.is_active && i.current_stock <= i.min_stock
  );

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Ingredients */}
        <div
          onClick={() => onNavigate('ingredients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Ingredients</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(totalIngredients)}</p>
          <div className="mt-2 flex items-center text-[10px] text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            {rawIngredientsCount} Raw &bull; {preparedIngredientsCount} Prepared (PP)
          </div>
        </div>

        {/* Stat 2: Total Menus */}
        <div
          onClick={() => onNavigate('menus')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Menus</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(totalMenus)}</p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            BOM Version: v2.4 Active
          </div>
        </div>

        {/* Stat 3: Transactions Today */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Transactions (Today)</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(todayTransactions.length)}</p>
          <div className="mt-2 text-[10px] text-slate-400">
            {transactions.length} Total Recorded History
          </div>
        </div>

        {/* Stat 4: Critical Alerts */}
        <div
          onClick={() => onNavigate('ingredients')}
          className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            criticalItems.length > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                criticalItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              Critical Alerts
            </p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                criticalItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold ${
              criticalItems.length > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`}
          >
            {formatNumber(criticalItems.length)}
          </p>
          <div
            className={`mt-2 text-[10px] font-semibold ${
              criticalItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {criticalItems.length > 0 ? 'REQUIRES REPLENISHMENT' : 'STOCKS OPTIMAL'}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stock Critical & Low Monitor (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Stock Critical & Low Monitor</h2>
              <p className="text-[11px] text-slate-500">Bahan baku yang membutuhkan pengadaan/prepare ulang</p>
            </div>
            <button
              onClick={() => onNavigate('ingredients')}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              View All Master Data
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {criticalItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Semua stok bahan berada pada level aman di atas batas minimum.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Ingredient Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">On Hand</th>
                    <th className="px-4 py-2.5 text-right">Min Stock</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {criticalItems.map((item) => {
                    const unit = units.find((u) => u.id === item.unit_id);
                    const isNegative = item.current_stock < 0;
                    const isZero = item.current_stock === 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 font-semibold">{item.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              item.type === 'raw'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {item.type === 'raw' ? 'Raw Material' : 'Prepared (PP)'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-extrabold ${item.current_stock < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                          {formatNumber(item.current_stock)} {unit?.abbreviation}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {formatNumber(item.min_stock)} {unit?.abbreviation}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isNegative ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-extrabold tracking-tight">
                              STOK MINUS
                            </span>
                          ) : isZero ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold tracking-tight">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold tracking-tight">
                              LOW STOCK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              item.type === 'raw'
                                ? onOpenQuickAction('purchase')
                                : onOpenQuickAction('prepare')
                            }
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors shadow-2xs"
                          >
                            {item.type === 'raw' ? '+ Buy' : '+ Prep'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center">
            Displaying {criticalItems.length}/{totalIngredients} items with active low stock alerts. Decimals automatically formatted.
          </div>
        </div>

        {/* Right Column: Recent Transactions & Estimator (1 col) */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">Recent Activity</h2>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-[11px] text-amber-600 hover:underline font-semibold"
              >
                View History
              </button>
            </div>
            <div className="p-4 space-y-3.5 overflow-y-auto max-h-72">
              {transactions.slice(0, 5).map((trx) => {
                const labelColor = {
                  purchase: 'bg-emerald-500',
                  prepare: 'bg-blue-500',
                  production: 'bg-amber-500',
                  adjustment: 'bg-purple-500',
                }[trx.type];

                const labelType = {
                  purchase: 'Purchase Order',
                  prepare: 'Prepare Process',
                  production: 'Production Finished',
                  adjustment: 'Stock Adjustment',
                }[trx.type];

                return (
                  <div key={trx.id} className="flex gap-3 relative">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 border border-slate-200">
                      <div className={`w-2 h-2 rounded-full ${labelColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{labelType}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{trx.reference_no}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(trx.transaction_date, true)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tool: Production Estimator Widget */}
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md overflow-hidden relative border border-slate-800">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full" />
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400">Quick Production Readiness</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Target Menu</span>
                <span className="font-semibold text-white">{menus[0]?.name || 'Menu jualan'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Target Batch</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-amber-300">10 Portion</span>
              </div>
              <div className="h-px bg-slate-800 my-1" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">Ingredient Status</span>
                <span className="text-emerald-400 font-bold text-[11px]">Ready To Produce</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[90%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
