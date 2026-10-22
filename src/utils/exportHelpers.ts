import { Meeting, Transaction, ClassInfo, User } from '../types/index.ts';

/**
 * Format currency to IDR
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Exports Meeting Minutes (Notulensi Rapat) to a formatted printable HTML window
 * that triggers the browser's PDF Print / Save dialog with professional academic styling.
 */
export function exportMeetingMinutesToPDF(meeting: Meeting, classInfo?: ClassInfo | null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up peramban untuk mencetak notulensi.');
    return;
  }

  const className = classInfo?.name || '01 SAKP 14';
  const classMajor = classInfo?.major || 'S1 Akuntansi Perpajakan';
  const academicYear = classInfo?.academic_year || '2026/2027';
  const meetingDateFormatted = new Date(meeting.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const discussionHtml = meeting.minutes?.discussion
    ? `<div class="section-box">${meeting.minutes.discussion.replace(/\n/g, '<br/>')}</div>`
    : '<p class="empty-text">Belum ada catatan pembahasan rapat.</p>';

  const decisionsHtml = meeting.minutes?.decisions
    ? `<div class="section-box highlight">${meeting.minutes.decisions.replace(/\n/g, '<br/>')}</div>`
    : '<p class="empty-text">Belum ada keputusan resmi yang dicatat.</p>';

  const actionItemsHtml = meeting.minutes?.action_items && meeting.minutes.action_items.length > 0
    ? `<table class="report-table">
        <thead>
          <tr>
            <th style="width: 8%;">No</th>
            <th style="width: 47%;">Tindak Lanjut / Action Item</th>
            <th style="width: 25%;">Penanggung Jawab (PIC)</th>
            <th style="width: 20%;">Tenggat Waktu</th>
          </tr>
        </thead>
        <tbody>
          ${meeting.minutes.action_items
            .map(
              (item, idx) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
              <td>${item.task}</td>
              <td><strong>${item.pic || 'Pengurus Kelas'}</strong></td>
              <td>${item.deadline || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>`
    : '<p class="empty-text">Tidak ada tindak lanjut khusus.</p>';

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Notulensi Rapat - ${meeting.title} - ${className}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 10px;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 2.5px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .kop-title {
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0;
    }
    .kop-subtitle {
      font-size: 10.5pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    .kop-info {
      font-size: 9pt;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 16px 0 14px 0;
      letter-spacing: 0.3px;
      color: #1e3a8a;
    }
    .meta-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 9.5pt;
    }
    .meta-grid td {
      padding: 4px 6px;
      vertical-align: top;
    }
    .meta-label {
      width: 22%;
      font-weight: 600;
      color: #334155;
    }
    .meta-sep {
      width: 2%;
      font-weight: 600;
    }
    .meta-val {
      width: 76%;
      color: #0f172a;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      border-left: 3.5px solid #2563eb;
      padding-left: 8px;
      margin: 16px 0 8px 0;
    }
    .section-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 9.5pt;
      margin-bottom: 12px;
    }
    .section-box.highlight {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e3a8a;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .report-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    .report-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      vertical-align: top;
    }
    .empty-text {
      color: #94a3b8;
      font-style: italic;
      font-size: 9pt;
      margin: 4px 0 12px 0;
    }
    .signature-area {
      margin-top: 32px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-col {
      width: 42%;
      text-align: center;
      font-size: 9.5pt;
    }
    .signature-space {
      height: 55px;
    }
    .signature-name {
      font-weight: 700;
      text-decoration: underline;
      margin: 0;
    }
    .signature-role {
      color: #475569;
      font-size: 8.5pt;
      margin-top: 2px;
    }
    .print-btn-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
    }
    @media print {
      .print-btn-bar {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="kop-surat">
    <h1 class="kop-title">PORTAL KELAS ${className}</h1>
    <p class="kop-subtitle">${classMajor} • ${academicYear}</p>
    <p class="kop-info">Sistem Administrasi dan Koordinasi Perkuliahan Terpadu</p>
  </div>

  <div class="doc-title">BERITA ACARA & NOTULENSI RAPAT</div>

  <table class="meta-grid">
    <tr>
      <td class="meta-label">Judul Rapat</td>
      <td class="meta-sep">:</td>
      <td class="meta-val"><strong>${meeting.title}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Hari / Tanggal</td>
      <td class="meta-sep">:</td>
      <td class="meta-val">${meetingDateFormatted}</td>
    </tr>
    <tr>
      <td class="meta-label">Waktu Rapat</td>
      <td class="meta-sep">:</td>
      <td class="meta-val">${meeting.start_time} - ${meeting.end_time} WIB</td>
    </tr>
    <tr>
      <td class="meta-label">Lokasi / Media</td>
      <td class="meta-sep">:</td>
      <td class="meta-val">${meeting.location || 'Online'} ${(meeting as any).link ? `(${(meeting as any).link})` : ''}</td>
    </tr>
    <tr>
      <td class="meta-label">Agenda Utama</td>
      <td class="meta-sep">:</td>
      <td class="meta-val">${meeting.minutes?.agenda || (meeting as any).agenda || '-'}</td>
    </tr>
  </table>

  <div class="section-title">I. Ringkasan Pembahasan</div>
  ${discussionHtml}

  <div class="section-title">II. Kesepakatan & Keputusan Rapat</div>
  ${decisionsHtml}

  <div class="section-title">III. Tindak Lanjut & Action Items</div>
  ${actionItemsHtml}

  <div class="signature-area">
    <div class="signature-col">
      <p>Mengetahui,<br/><strong>Ketua Kelas</strong></p>
      <div class="signature-space"></div>
      <p class="signature-name">M. RACHMAN FAJRI M.</p>
      <p class="signature-role">NIM. 261011201412</p>
    </div>

    <div class="signature-col">
      <p>Pencatat Notulensi,<br/><strong>Sekretaris Kelas</strong></p>
      <div class="signature-space"></div>
      <p class="signature-name">AISNA FELIA FAISAL</p>
      <p class="signature-role">NIM. 261011201226</p>
    </div>
  </div>

  <button class="print-btn-bar" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>

  <script>
    window.onload = function() {
      // Auto trigger print if desired
      setTimeout(() => {
        // window.print();
      }, 500);
    }
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Exports Kas Ledger & Financial Summary to a formatted printable PDF window
 */
export function exportKasReportToPDF(
  transactions: Transaction[],
  summary: { totalIncome: number; totalExpense: number; balance: number },
  classInfo?: ClassInfo | null
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up peramban untuk mencetak laporan kas.');
    return;
  }

  const className = classInfo?.name || '01 SAKP 14';
  const classMajor = classInfo?.major || 'S1 Akuntansi Perpajakan';
  const academicYear = classInfo?.academic_year || '2026/2027';
  const printDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(b.created_at || (b as any).date).getTime() - new Date(a.created_at || (a as any).date).getTime()
  );

  const rowsHtml = sortedTx
    .map((tx, idx) => {
      const isIncome = tx.type === 'income';
      const txDate = tx.created_at || (tx as any).date;
      const txCat = tx.category_name || (tx as any).category || 'Umum';
      return `
      <tr>
        <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
        <td>${txDate ? new Date(txDate).toLocaleDateString('id-ID') : '-'}</td>
        <td><strong>${tx.description}</strong></td>
        <td>${txCat}</td>
        <td style="text-align: right; color: ${isIncome ? '#16a34a' : '#64748b'}; font-weight: ${isIncome ? 'bold' : 'normal'};">
          ${isIncome ? formatIDR(tx.amount) : '-'}
        </td>
        <td style="text-align: right; color: ${!isIncome ? '#dc2626' : '#64748b'}; font-weight: ${!isIncome ? 'bold' : 'normal'};">
          ${!isIncome ? formatIDR(tx.amount) : '-'}
        </td>
      </tr>
    `;
    })
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Kas Transparan - ${className}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      font-size: 10pt;
      margin: 0;
      padding: 10px;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .kop-title {
      font-size: 14pt;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0;
      color: #0f172a;
    }
    .kop-subtitle {
      font-size: 10pt;
      color: #475569;
      margin: 2px 0 0 0;
    }
    .doc-title {
      text-align: center;
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 12px 0;
      color: #1e3a8a;
    }
    .summary-cards {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .card {
      flex: 1;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      text-align: center;
    }
    .card-label {
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
    }
    .card-value {
      font-size: 12pt;
      font-weight: 800;
      margin-top: 4px;
    }
    .table-ledger {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 20px;
    }
    .table-ledger th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px;
      text-align: left;
      font-weight: 700;
    }
    .table-ledger td {
      border: 1px solid #e2e8f0;
      padding: 5px 6px;
      vertical-align: top;
    }
    .signature-area {
      margin-top: 24px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-col {
      width: 42%;
      text-align: center;
      font-size: 9pt;
    }
    .signature-space {
      height: 50px;
    }
    .signature-name {
      font-weight: 700;
      text-decoration: underline;
      margin: 0;
    }
    .signature-role {
      color: #475569;
      font-size: 8pt;
      margin-top: 2px;
    }
    .print-btn-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #16a34a;
      color: white;
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
    }
    @media print {
      .print-btn-bar {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="kop-surat">
    <h1 class="kop-title">LAPORAN KAS & KEUANGAN KELAS ${className}</h1>
    <p class="kop-subtitle">${classMajor} • Tahun Akademik ${academicYear}</p>
    <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">Per Tanggal: ${printDate}</p>
  </div>

  <div class="summary-cards">
    <div class="card">
      <div class="card-label">Total Pemasukan Kas</div>
      <div class="card-value" style="color: #16a34a;">${formatIDR(summary.totalIncome)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Pengeluaran Kas</div>
      <div class="card-value" style="color: #dc2626;">${formatIDR(summary.totalExpense)}</div>
    </div>
    <div class="card" style="background: #eff6ff; border-color: #93c5fd;">
      <div class="card-label">Saldo Kas Bersih</div>
      <div class="card-value" style="color: #1d4ed8;">${formatIDR(summary.balance)}</div>
    </div>
  </div>

  <table class="table-ledger">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">No</th>
        <th style="width: 14%;">Tanggal</th>
        <th style="width: 40%;">Uraian Transaksi</th>
        <th style="width: 16%;">Kategori</th>
        <th style="width: 12%; text-align: right;">Masuk (IDR)</th>
        <th style="width: 12%; text-align: right;">Keluar (IDR)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signature-area">
    <div class="signature-col">
      <p>Mengetahui,<br/><strong>Ketua Kelas</strong></p>
      <div class="signature-space"></div>
      <p class="signature-name">M. RACHMAN FAJRI M.</p>
      <p class="signature-role">NIM. 261011201412</p>
    </div>

    <div class="signature-col">
      <p>Dibuat Oleh,<br/><strong>Bendahara Kelas</strong></p>
      <div class="signature-space"></div>
      <p class="signature-name">CINTIA FEBRIONA</p>
      <p class="signature-role">NIM. 261011201472</p>
    </div>
  </div>

  <button class="print-btn-bar" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Exports Kas Transactions to CSV / Excel spreadsheet format
 */
export function exportKasReportToExcel(transactions: Transaction[], classInfo?: ClassInfo | null) {
  const className = (classInfo?.name || '01 SAKP 14').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Kas_${className}_${dateStr}.csv`;

  const headers = ['No', 'Tanggal', 'Jenis Transaksi', 'Kategori', 'Keterangan', 'Nominal (IDR)', 'Status'];

  const rows = transactions.map((t, idx) => [
    idx + 1,
    t.created_at || (t as any).date || '',
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    `"${(t.category_name || (t as any).category || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount,
    (t as any).status === 'confirmed' || !t.deleted_at ? 'Terkonfirmasi' : 'Dibatalkan',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports 39 Students Member Directory to CSV / Excel spreadsheet format
 */
export function exportMembersToExcel(members: User[], classInfo?: ClassInfo | null) {
  const className = (classInfo?.name || '01 SAKP 14').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Daftar_Mahasiswa_${className}_${dateStr}.csv`;

  const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Role / Jabatan', 'Email Google / Kampus', 'No. WhatsApp', 'Status Akun'];

  const rows = members.map((m, idx) => [
    idx + 1,
    `"${m.nim}"`,
    `"${(m.name || '').replace(/"/g, '""')}"`,
    `"${(m.role_name || m.position || 'Anggota').replace(/"/g, '""')}"`,
    `"${m.email || ''}"`,
    `"${m.phone || ''}"`,
    m.is_active ? 'Aktif' : 'Non-Aktif',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts numbers into Indonesian word representation (Terbilang)
 */
export function terbilangRupiah(num: number): string {
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (num === 0) return 'Nol Rupiah';
  if (num < 12) return satuan[num] + ' Rupiah';
  if (num < 20) return terbilangRupiah(num - 10).replace(' Rupiah', '') + ' Belas Rupiah';
  if (num < 100) return satuan[Math.floor(num / 10)] + ' Puluh ' + (num % 10 !== 0 ? terbilangRupiah(num % 10) : 'Rupiah');
  if (num < 200) return 'Seratus ' + (num % 100 !== 0 ? terbilangRupiah(num - 100) : 'Rupiah');
  if (num < 1000) return satuan[Math.floor(num / 100)] + ' Ratus ' + (num % 100 !== 0 ? terbilangRupiah(num % 100) : 'Rupiah');
  if (num < 2000) return 'Seribu ' + (num % 1000 !== 0 ? terbilangRupiah(num - 1000) : 'Rupiah');
  if (num < 1000000) return terbilangRupiah(Math.floor(num / 1000)).replace(' Rupiah', '') + ' Ribu ' + (num % 1000 !== 0 ? terbilangRupiah(num % 1000) : 'Rupiah');
  if (num < 1000000000) return terbilangRupiah(Math.floor(num / 1000000)).replace(' Rupiah', '') + ' Juta ' + (num % 1000000 !== 0 ? terbilangRupiah(num % 1000000) : 'Rupiah');
  return formatIDR(num);
}

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentNim: string;
  amount: number;
  paymentFor: string;
  paymentMethod?: string;
  date?: string;
  treasurerName?: string;
}

/**
 * Generates an official digital cash receipt (Kwitansi Digital Kas Kelas) in PDF print view
 */
export function exportKasReceiptToPDF(receipt: ReceiptData, classInfo?: ClassInfo | null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up peramban untuk mencetak kwitansi.');
    return;
  }

  const className = classInfo?.name || 'Kelas Manager 01 SAKP 14';
  const majorName = classInfo?.major || 'S1 Akuntansi Perpajakan';
  const wordsAmount = terbilangRupiah(receipt.amount);
  const formattedDate = new Date(receipt.date || Date.now()).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kwitansi Pembayaran Kas - ${receipt.receiptNumber}</title>
  <style>
    @page { size: A5 landscape; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 12px;
      background: #f8fafc;
    }
    .receipt-card {
      background: #ffffff;
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 24px;
      position: relative;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .org-title { font-size: 16px; font-weight: 800; color: #1e3a8a; margin: 0; }
    .org-sub { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
    .receipt-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 6px 12px;
      border-radius: 8px;
      text-align: right;
    }
    .receipt-title { font-size: 13px; font-weight: 800; color: #1e40af; margin: 0; text-transform: uppercase; }
    .receipt-no { font-family: monospace; font-size: 12px; font-weight: 700; color: #2563eb; margin: 2px 0 0 0; }
    
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 13px;
    }
    .content-table td { padding: 6px 4px; vertical-align: top; }
    .label { width: 22%; font-weight: 600; color: #475569; }
    .sep { width: 3%; font-weight: bold; color: #94a3b8; }
    .val { width: 75%; font-weight: 700; color: #0f172a; }
    
    .amount-box {
      background: #f0fdf4;
      border: 1px dashed #22c55e;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .amount-num { font-size: 18px; font-weight: 900; color: #15803d; }
    .amount-words { font-size: 11px; color: #166534; font-style: italic; }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
    }
    .footer-left { font-size: 10px; color: #94a3b8; }
    .sign-box { text-align: center; width: 180px; }
    .sign-date { font-size: 11px; color: #64748b; margin-bottom: 28px; }
    .sign-name { font-size: 12px; font-weight: 700; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 4px; margin: 0; }
    .sign-role { font-size: 10px; color: #64748b; margin: 0; }
    
    .btn-print {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37,99,235,0.3);
    }
    @media print {
      body { background: transparent; padding: 0; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div>
        <h2 class="org-title">TANDA TERIMA PEMBAYARAN KAS</h2>
        <p class="org-sub">${className} • ${majorName}</p>
      </div>
      <div class="receipt-badge">
        <p class="receipt-title">KWITANSI RESMI</p>
        <p class="receipt-no">No: ${receipt.receiptNumber}</p>
      </div>
    </div>

    <table class="content-table">
      <tr>
        <td class="label">Telah Terima Dari</td>
        <td class="sep">:</td>
        <td class="val">${receipt.studentName} <span style="font-family: monospace; font-size: 11px; color: #64748b;">(NIM: ${receipt.studentNim})</span></td>
      </tr>
      <tr>
        <td class="label">Uang Sejumlah</td>
        <td class="sep">:</td>
        <td class="val" style="color: #16a34a;">${formatIDR(receipt.amount)}</td>
      </tr>
      <tr>
        <td class="label">Terbilang</td>
        <td class="sep">:</td>
        <td class="val" style="font-style: italic; color: #334155;">${wordsAmount}</td>
      </tr>
      <tr>
        <td class="label">Untuk Pembayaran</td>
        <td class="sep">:</td>
        <td class="val">${receipt.paymentFor}</td>
      </tr>
      <tr>
        <td class="label">Metode Pembayaran</td>
        <td class="sep">:</td>
        <td class="val">${receipt.paymentMethod || 'Transfer Bank / QRIS Kas Kelas'}</td>
      </tr>
    </table>

    <div class="amount-box">
      <div>
        <span style="font-size: 10px; color: #166534; font-weight: 700; text-transform: uppercase;">Total Pembayaran Lunas</span>
        <div class="amount-num">${formatIDR(receipt.amount)}</div>
      </div>
      <div class="amount-words">"${wordsAmount}"</div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <p style="margin:0;">Dicetak otomatis melalui <strong>Kelas Manager</strong></p>
        <p style="margin:2px 0 0 0;">Bukti sah tanda terima iuran bendahara kelas perkuliahan</p>
      </div>
      <div class="sign-box">
        <div class="sign-date">${formattedDate}</div>
        <div class="sign-name">${receipt.treasurerName || 'Bendahara Kelas'}</div>
        <p class="sign-role">Bendahara Kas ${className}</p>
      </div>
    </div>
  </div>

  <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
