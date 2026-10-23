import { KasTransaction, KasMember, ClassSettings } from '../types/kas.ts';

export const generateGoogleSheetsCsv = (
  transactions: KasTransaction[],
  members: KasMember[],
  settings: ClassSettings
): string => {
  let csv = `REKAP LAPORAN KAS - ${settings.className.toUpperCase()}\n`;
  csv += `Tahun Ajaran: ${settings.academicYear}\n`;
  csv += `Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n\n`;

  // 1. Transactions Section
  csv += `--- MUTASI KAS MASUK & KELUAR ---\n`;
  csv += `No,Tanggal,Jenis Arus Kas,Keterangan,Kategori,Nominal (IDR),Dicatat Oleh,Catatan Nota\n`;

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx, idx) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;

    const safeTitle = `"${tx.title.replace(/"/g, '""')}"`;
    const safeNotes = `"${(tx.notes || '').replace(/"/g, '""')}"`;
    const typeLabel = tx.type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)';

    csv += `${idx + 1},${tx.date},${typeLabel},${safeTitle},"${tx.category}",${tx.amount},"${tx.recordedBy}",${safeNotes}\n`;
  });

  csv += `,,TOTAL PEMASUKAN,,,${totalIncome},,\n`;
  csv += `,,TOTAL PENGELUARAN,,,${totalExpense},,\n`;
  csv += `,,SALDO KAS BERSIH,,,${totalIncome - totalExpense},,\n\n`;

  // 2. Members Dues Checklist Section
  csv += `--- CHECKLIST IURAN KAS MINGGUAN ---\n`;
  csv += `No,Nama Siswa,NIM,Nomor WA,M1,M2,M3,M4,M5,M6,M7,M8,Total Terbayar (IDR),Status Lunas\n`;

  const WEEKS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];

  members.forEach((m, idx) => {
    let paidCount = 0;
    const weekCols = WEEKS.map(w => {
      const isPaid = !!m.weeklyStatus[w];
      if (isPaid) paidCount++;
      return isPaid ? 'LUNAS' : 'BELUM';
    }).join(',');

    const totalPaid = paidCount * settings.weeklyDuesAmount;
    const statusLabel = paidCount === WEEKS.length ? 'LUNAS SEMUA' : `MENUNGGAK (${WEEKS.length - paidCount} MINGGU)`;
    const safeName = `"${m.name.replace(/"/g, '""')}"`;

    csv += `${idx + 1},${safeName},'${m.studentId},'${m.phone || '-'},${weekCols},${totalPaid},"${statusLabel}"\n`;
  });

  return csv;
};

export const downloadCsvFile = (filename: string, csvContent: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const openGoogleSheetsImportGuide = (): void => {
  window.open('https://sheets.new', '_blank');
};
