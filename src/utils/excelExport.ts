import * as XLSX from 'xlsx';
import { KasTransaction, KasMember } from '../types/kas.ts';

export const exportToExcel = (
  transactions: KasTransaction[],
  members: KasMember[],
  className: string = 'Kelas Gue'
) => {
  // 1. Data Transaksi (Buku Kas)
  const txData = transactions.map(t => ({
    'Tanggal': t.date,
    'Judul': t.title,
    'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Jumlah': t.amount,
    'Kategori': t.category,
    'Dicatat Oleh': t.recordedBy,
    'Catatan': t.notes || '-'
  }));

  // 2. Data Iuran (Checklist)
  // Get all unique weeks
  const allWeeks = Array.from(new Set(members.flatMap(m => Object.keys(m.weeklyStatus || {})))).sort();
  
  const memberData = members.map(m => {
    const row: any = {
      'Nama': m.name,
      'NIM/Student ID': m.studentId,
    };
    allWeeks.forEach(week => {
      row[week] = m.weeklyStatus?.[week] ? 'LUNAS' : 'BELUM';
    });
    return row;
  });

  // Create Workbook
  const wb = XLSX.utils.book_new();
  
  // Add Transactions Sheet
  const wsTx = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, "Buku Kas");
  
  // Add Members/Dues Sheet
  const wsMembers = XLSX.utils.json_to_sheet(memberData);
  XLSX.utils.book_append_sheet(wb, wsMembers, "Iuran Anggota");

  // Export File
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Laporan_${className.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
};
