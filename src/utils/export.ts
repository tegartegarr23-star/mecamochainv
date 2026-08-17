import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyStockRow, StockMovement, Ingredient, Unit } from '../types';
import { formatNumber, formatDate } from './formatters';

/**
 * Export Daily Stock Report to Excel
 */
export function exportDailyStockToExcel(data: DailyStockRow[], dateFilter: string) {
  const exportData = data.map((row, index) => ({
    No: index + 1,
    'Kode Bahan': row.ingredient.code,
    'Nama Bahan': row.ingredient.name,
    Kategori: row.category?.name || '-',
    Satuan: row.unit?.abbreviation || '-',
    'Stok Awal': row.initial_stock,
    'Masuk (Pembelian)': row.in_purchase,
    'Masuk (Prepare)': row.in_prepare,
    'Keluar (Prepare)': row.out_prepare,
    'Keluar (Produksi)': row.out_production,
    'Masuk (Penyesuaian)': row.in_adjustment,
    'Keluar (Penyesuaian)': row.out_adjustment,
    'Stok Akhir': row.final_stock,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok');

  // Auto-fit column widths
  const max_cols = Object.keys(exportData[0] || {}).length;
  worksheet['!cols'] = Array(max_cols).fill({ wch: 18 });

  XLSX.writeFile(workbook, `Laporan_Stok_Mecamocha_${dateFilter || 'Hari_Ini'}.xlsx`);
}

/**
 * Export Daily Stock Report to PDF
 */
export function exportDailyStockToPDF(data: DailyStockRow[], dateFilter: string) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text('MECAMOCHA F&B INVENTORY', 14, 15);
  doc.setFontSize(12);
  doc.text(`Laporan Stok Harian - Tanggal: ${formatDate(dateFilter || new Date().toISOString())}`, 14, 22);

  const tableColumn = [
    'No',
    'Kode',
    'Nama Bahan',
    'Satuan',
    'Awal',
    'Masuk (Beli)',
    'Masuk (Prep)',
    'Keluar (Prep)',
    'Keluar (Prod)',
    'Adj (+)',
    'Adj (-)',
    'Stok Akhir',
  ];

  const tableRows = data.map((row, i) => [
    i + 1,
    row.ingredient.code,
    row.ingredient.name,
    row.unit?.abbreviation || '-',
    formatNumber(row.initial_stock),
    formatNumber(row.in_purchase),
    formatNumber(row.in_prepare),
    formatNumber(row.out_prepare),
    formatNumber(row.out_production),
    formatNumber(row.in_adjustment),
    formatNumber(row.out_adjustment),
    formatNumber(row.final_stock),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 }, // Warm Amber / Brown
    styles: { fontSize: 8 },
  });

  doc.save(`Laporan_Stok_Mecamocha_${dateFilter || 'Hari_Ini'}.pdf`);
}

/**
 * Export Stock Ledger to Excel
 */
export function exportLedgerToExcel(
  movements: StockMovement[],
  ingredient: Ingredient,
  unit: Unit
) {
  const exportData = movements.map((m, index) => ({
    No: index + 1,
    Tanggal: formatDate(m.created_at, true),
    'Tipe Mutasi': m.type === 'in' ? 'Masuk (+)' : 'Keluar (-)',
    'Jumlah (Qty)': m.quantity,
    'Saldo Akhir': m.balance_after,
    Keterangan: m.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mutasi Stok');

  XLSX.writeFile(
    workbook,
    `Mutasi_Stok_${ingredient.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/**
 * Export Stock Ledger to PDF
 */
export function exportLedgerToPDF(
  movements: StockMovement[],
  ingredient: Ingredient,
  unit: Unit
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('MECAMOCHA F&B INVENTORY', 14, 15);
  doc.setFontSize(12);
  doc.text(`Kartu Stok / Ledger: ${ingredient.name} (${ingredient.code})`, 14, 22);
  doc.setFontSize(10);
  doc.text(`Satuan: ${unit.name} (${unit.abbreviation}) | Stok Saat Ini: ${formatNumber(ingredient.current_stock)}`, 14, 28);

  const tableColumn = ['No', 'Tanggal', 'Mutasi', 'Jumlah', 'Saldo Akhir', 'Keterangan'];
  const tableRows = movements.map((m, i) => [
    i + 1,
    formatDate(m.created_at, true),
    m.type === 'in' ? 'Masuk (+)' : 'Keluar (-)',
    formatNumber(m.quantity),
    formatNumber(m.balance_after),
    m.description,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 34,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`Mutasi_Stok_${ingredient.code}.pdf`);
}

/**
 * Export Adjustment / Opname Report to Excel
 */
export function exportAdjustmentToExcel(
  adjustments: Array<{
    date: string;
    refNo: string;
    ingredientName: string;
    ingredientCode: string;
    category: string;
    unit: string;
    reason: string;
    mode: string;
    qty: number;
    diff: number;
    balanceAfter: number;
    createdBy: string;
    notes: string;
  }>,
  dateFilter: string
) {
  const exportData = adjustments.map((adj, index) => ({
    No: index + 1,
    'Tanggal & Jam': formatDate(adj.date, true),
    'No. Referensi': adj.refNo,
    'Kode Bahan': adj.ingredientCode,
    'Nama Bahan': adj.ingredientName,
    Kategori: adj.category,
    Satuan: adj.unit,
    Alasan: adj.reason,
    'Mode Penyesuaian': adj.mode,
    'Kuantitas (Qty)': adj.qty,
    'Selisih (+/-)': adj.diff >= 0 ? `+${formatNumber(adj.diff)}` : formatNumber(adj.diff),
    'Stok Sesudah': adj.balanceAfter,
    'Petugas (User)': adj.createdBy,
    Catatan: adj.notes,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penyesuaian & Opname');

  const max_cols = Object.keys(exportData[0] || {}).length;
  worksheet['!cols'] = Array(max_cols).fill({ wch: 18 });

  XLSX.writeFile(workbook, `Laporan_Penyesuaian_Opname_${dateFilter || 'Semua'}.xlsx`);
}

/**
 * Export Adjustment / Opname Report to PDF
 */
export function exportAdjustmentToPDF(
  adjustments: Array<{
    date: string;
    refNo: string;
    ingredientName: string;
    ingredientCode: string;
    category: string;
    unit: string;
    reason: string;
    mode: string;
    qty: number;
    diff: number;
    balanceAfter: number;
    createdBy: string;
    notes: string;
  }>,
  dateFilter: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text('MECAMOCHA F&B INVENTORY', 14, 15);
  doc.setFontSize(12);
  doc.text(`Laporan Penyesuaian & Stock Opname - Filter: ${dateFilter || 'Semua Periode'}`, 14, 22);

  const tableColumn = [
    'No',
    'Tanggal',
    'No. Ref',
    'Kode & Bahan',
    'Alasan',
    'Mode',
    'Qty / Selisih',
    'Stok Akhir',
    'Petugas',
    'Catatan',
  ];

  const tableRows = adjustments.map((adj, i) => [
    i + 1,
    formatDate(adj.date, true),
    adj.refNo,
    `${adj.ingredientCode} - ${adj.ingredientName}`,
    adj.reason,
    adj.mode,
    `${adj.diff >= 0 ? '+' : ''}${formatNumber(adj.diff)} ${adj.unit}`,
    `${formatNumber(adj.balanceAfter)} ${adj.unit}`,
    adj.createdBy,
    adj.notes || '-',
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [109, 40, 217], textColor: 255 }, // Purple theme for Adjustments
    styles: { fontSize: 8 },
  });

  doc.save(`Laporan_Penyesuaian_Opname_${dateFilter || 'Semua'}.pdf`);
}
