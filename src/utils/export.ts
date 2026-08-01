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
