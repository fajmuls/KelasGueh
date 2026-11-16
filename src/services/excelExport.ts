import * as XLSX from 'xlsx';
import {
  ClassDefinition,
  ClassSettings,
  KasTransaction,
  KasMember,
  KolektifBill,
  StudentPointLog,
  AttendanceRecord,
  MeetingMinute,
  CourseSchedule
} from '../types/kas.ts';
import { AuditLogEntry } from './supabaseClient.ts';
import { toTitleCase } from '../utils/textFormatting.ts';

export interface SpreadsheetExportPayload {
  classDef: ClassDefinition;
  settings: ClassSettings;
  members: KasMember[];
  transactions: KasTransaction[];
  kolektifBills: KolektifBill[];
  pointLogs: StudentPointLog[];
  attendanceRecords: AttendanceRecord[];
  meetingMinutes: MeetingMinute[];
  courseSchedules: CourseSchedule[];
  savedGroups: any[];
  auditLogs: AuditLogEntry[];
}

export interface SpreadsheetTabInfo {
  name: string;
  description: string;
}

export const SPREADSHEET_TAB_DESCRIPTIONS: SpreadsheetTabInfo[] = [
  { name: 'Ringkasan_Kelas', description: 'Identitas kelas, rekap pemasukan, pengeluaran, saldo & statistik' },
  { name: 'Buku_Kas', description: 'Catatan mutasi kas masuk/keluar lengkap beserta tanggal & kategori' },
  { name: 'Siswa_Dan_Iuran', description: 'Daftar siswa, NIM, kontak WA, total terbayar & pekan lunas' },
  { name: 'Tagihan_Kolektif', description: 'Daftar iuran acara/patungan, peserta & progress pelunasan' },
  { name: 'Keaktifan_Presensi', description: 'Rekap poin keaktifan mahasiswa & absensi pertemuan' },
  { name: 'Notulensi_Jadwal', description: 'Notulensi rapat kelas serta jadwal mata kuliah & tugas' },
  { name: 'Kelompok_Matkul', description: 'Daftar kelompok per mata kuliah, anggota & link pengumpulan' },
  { name: 'Audit_Log', description: 'Riwayat aktivitas dan perubahan data pengurus' }
];

export const getAdminSpreadsheetTabNames = (): string[] =>
  SPREADSHEET_TAB_DESCRIPTIONS.map(t => t.name);

const toInt = (val: unknown): number => Math.round(Number(val) || 0);

function calcColWidths(rows: (string | number)[][]): XLSX.ColInfo[] {
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const widths: XLSX.ColInfo[] = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    for (let r = 0; r < rows.length; r++) {
      const cell = rows[r]?.[c];
      if (cell !== undefined && cell !== null) {
        const len = String(cell).length;
        if (len > maxLen) maxLen = len;
      }
    }
    widths.push({ wch: Math.min(Math.max(maxLen + 3, 12), 48) });
  }
  return widths;
}

function makeSheet(rows: (string | number)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = calcColWidths(rows);
  return ws;
}

export function buildAllSpreadsheetSheets(
  data: SpreadsheetExportPayload
): Array<{ title: string; rows: (string | number)[][] }> {
  const {
    classDef,
    settings,
    members,
    transactions,
    kolektifBills,
    pointLogs,
    attendanceRecords,
    meetingMinutes,
    courseSchedules,
    savedGroups,
    auditLogs
  } = data;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const activeMembers = members.filter(m => m.isActive !== false);
  const nowStr = new Date().toLocaleString('id-ID');

  // 1. Ringkasan_Kelas
  const ringkasanRows: (string | number)[][] = [
    ['PARAMETER LAPORAN KELAS', 'NILAI / DATA', 'KETERANGAN'],
    ['Kode Kelas', classDef.code, classDef.isArchived ? 'Arsip Semester Lama' : 'Aktif'],
    ['Nama Kelas', settings.className || classDef.name, settings.academicYear || classDef.academicYear],
    ['Status Semester', classDef.isArchived ? 'ARSIP / KENANGAN' : 'SEMESTER AKTIF', 'Prioritas Akses Kelas'],
    ['Tanggal Ekspor Spreadsheet', nowStr, 'File .xlsx Siap Impor Google Sheets / Excel'],
    ['Tarif Iuran Mingguan (IDR)', toInt(settings.weeklyDuesAmount), 'IDR / Minggu'],
    ['Target Kas Kelas (IDR)', toInt(settings.kasTargetAmount), 'IDR'],
    ['Total Pemasukan Kas (IDR)', toInt(totalIncome), `${transactions.filter(t => t.type === 'income').length} Transaksi`],
    ['Total Pengeluaran Kas (IDR)', toInt(totalExpense), `${transactions.filter(t => t.type === 'expense').length} Transaksi`],
    ['Saldo Kas Bersih (IDR)', toInt(netBalance), 'Pemasukan - Pengeluaran'],
    ['Total Siswa Aktif', activeMembers.length, `Dari total ${members.length} siswa terdaftar`],
    ['Jumlah Tagihan Kolektif', kolektifBills.length, 'Acara & Patungan'],
    ['Jumlah Sesi Presensi', attendanceRecords.length, 'Kuliah, Rapat & Kegiatan'],
    ['Jumlah Catatan Notulensi', meetingMinutes.length, 'Notulensi Rapat Kelas'],
    ['Jumlah Arsip Kelompok', savedGroups.length, 'Koleksi Pembagian Kelompok Matkul'],
    ['Jumlah Log Audit', auditLogs.length, 'Maksimal 200 log terbaru'],
    [
      'PIN Transaksi Besar',
      settings.requireTransactionPin !== false ? 'AKTIF' : 'NONAKTIF',
      `Batas Nominal: Rp ${toInt(settings.transactionPinThreshold ?? 500000).toLocaleString('id-ID')}`
    ]
  ];

  // 2. Buku_Kas
  const bukuKasRows: (string | number)[][] = [
    ['No', 'Tanggal', 'Jenis', 'Judul / Keterangan', 'Kategori', 'Nominal (IDR)', 'Dicatat Oleh', 'Catatan', 'ID Transaksi']
  ];
  transactions.forEach((tx, idx) => {
    bukuKasRows.push([
      idx + 1,
      tx.date || '-',
      tx.type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
      tx.title || '-',
      tx.category || '-',
      toInt(tx.amount),
      tx.recordedBy || '-',
      tx.notes || '',
      tx.id
    ]);
  });

  // 3. Siswa_Dan_Iuran
  const siswaRows: (string | number)[][] = [
    ['No', 'Nama Siswa', 'NIM / Absen', 'Gender', 'Status', 'No. HP / WA', 'Pekan Lunas', 'Total Iuran Terbayar (IDR)', 'Daftar Pekan Lunas']
  ];
  members.forEach((m, idx) => {
    const paidKeys = Object.entries(m.weeklyStatus || {})
      .filter(([, paid]) => Boolean(paid))
      .map(([k]) => k)
      .sort();
    siswaRows.push([
      idx + 1,
      toTitleCase(m.name),
      m.studentId || '-',
      m.gender === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)',
      m.isActive === false ? 'Non-Aktif' : 'Aktif',
      m.phone || '-',
      paidKeys.length,
      toInt(paidKeys.length * (settings.weeklyDuesAmount || 5000)),
      paidKeys.join(', ') || '-'
    ]);
  });

  // 4. Tagihan_Kolektif
  const kolektifRows: (string | number)[][] = [
    ['No', 'Judul Tagihan', 'Jenis', 'Kategori', 'Nominal Per Siswa (IDR)', 'Jatuh Tempo', 'Jumlah Peserta', 'Sudah Lunas', 'Total Terkumpul (IDR)', 'Sinkron ke Kas']
  ];
  kolektifBills.forEach((b, idx) => {
    const paidCount = (b.paidMemberIds || []).length;
    kolektifRows.push([
      idx + 1,
      b.title,
      b.billType === 'patungan' ? 'Patungan' : 'Acara/Kolektif',
      b.category || '-',
      toInt(b.amountPerPerson),
      b.dueDate || '-',
      (b.participantIds || []).length,
      paidCount,
      toInt(paidCount * (b.amountPerPerson || 0)),
      b.syncedToKas ? 'Sudah Masuk Kas' : 'Terpisah'
    ]);
  });

  // 5. Keaktifan_Presensi
  const memberNameById = new Map<string, string>();
  members.forEach(m => memberNameById.set(m.id, toTitleCase(m.name)));

  const keaktifanRows: (string | number)[][] = [
    ['BAGIAN A: POIN KEAKTIFAN MAHASISWA'],
    ['No', 'Tanggal', 'Nama Siswa', 'Kategori', 'Poin', 'Alasan / Keterangan', 'Dicatat Oleh']
  ];
  pointLogs.forEach((p, idx) => {
    keaktifanRows.push([
      idx + 1,
      p.date,
      memberNameById.get(p.memberId) || p.memberId,
      p.category,
      toInt(p.points),
      p.reason,
      p.recordedBy
    ]);
  });
  keaktifanRows.push([]);
  keaktifanRows.push(['BAGIAN B: REKAP SESI PRESENSI']);
  keaktifanRows.push(['No', 'Tanggal', 'Judul Pertemuan', 'Jenis', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Dicatat Oleh']);
  attendanceRecords.forEach((rec, idx) => {
    const vals = Object.values(rec.statuses || {});
    keaktifanRows.push([
      idx + 1,
      rec.date,
      rec.title,
      rec.type,
      vals.filter(v => v === 'hadir').length,
      vals.filter(v => v === 'izin').length,
      vals.filter(v => v === 'sakit').length,
      vals.filter(v => v === 'alpa').length,
      rec.recordedBy
    ]);
  });

  // 6. Notulensi_Jadwal
  const notulensiRows: (string | number)[][] = [
    ['BAGIAN A: NOTULENSI RAPAT KELAS'],
    ['No', 'Tanggal', 'Judul Rapat', 'Pemimpin', 'Notulis', 'Agenda', 'Keputusan Utama']
  ];
  meetingMinutes.forEach((min, idx) => {
    notulensiRows.push([
      idx + 1,
      min.date,
      min.title,
      min.leader,
      min.noteTaker,
      min.agenda,
      min.decisions
    ]);
  });
  notulensiRows.push([]);
  notulensiRows.push(['BAGIAN B: JADWAL MATA KULIAH & TUGAS']);
  notulensiRows.push(['Mata Kuliah', 'Dosen', 'SKS', 'Hari', 'Jam', 'Judul Tugas', 'Deadline', 'Status Tugas']);
  courseSchedules.forEach(course => {
    if (!course.assignments || course.assignments.length === 0) {
      notulensiRows.push([
        course.courseName,
        course.lecturerName,
        course.sks,
        course.day,
        course.time,
        '(Belum ada tugas)',
        '-',
        '-'
      ]);
    } else {
      course.assignments.forEach(asg => {
        notulensiRows.push([
          course.courseName,
          course.lecturerName,
          course.sks,
          course.day,
          course.time,
          asg.title,
          asg.deadline,
          asg.status === 'selesai' ? 'Selesai' : 'Belum Selesai'
        ]);
      });
    }
  });

  // 7. Kelompok_Matkul
  const kelompokRows: (string | number)[][] = [
    ['Mata Kuliah', 'Tugas / Proyek', 'Deadline', 'Nama Kelompok', 'Anggota Kelompok', 'Status Tugas', 'Link Pengumpulan']
  ];
  savedGroups.forEach((col: any) => {
    (col.groups || []).forEach((g: any) => {
      const namesList = (g.members || [])
        .map((m: any, i: number) => `${i + 1}. ${toTitleCase(m.name || '')}`)
        .join('; ');
      kelompokRows.push([
        col.courseName || '-',
        col.taskTitle || '-',
        col.taskDeadline || '-',
        g.name || `Kelompok ${g.id}`,
        namesList || '-',
        g.isCompleted ? 'Selesai' : 'Belum Selesai',
        g.submissionUrl || '-'
      ]);
    });
  });

  // 8. Audit_Log
  const auditRows: (string | number)[][] = [
    ['No', 'Waktu', 'Aksi', 'Dilakukan Oleh', 'Role', 'Rincian Detail']
  ];
  auditLogs.slice(0, 200).forEach((log, idx) => {
    auditRows.push([
      idx + 1,
      log.timestamp,
      log.action,
      log.performedBy,
      log.userRole,
      log.details
    ]);
  });

  return [
    { title: 'Ringkasan_Kelas', rows: ringkasanRows },
    { title: 'Buku_Kas', rows: bukuKasRows },
    { title: 'Siswa_Dan_Iuran', rows: siswaRows },
    { title: 'Tagihan_Kolektif', rows: kolektifRows },
    { title: 'Keaktifan_Presensi', rows: keaktifanRows },
    { title: 'Notulensi_Jadwal', rows: notulensiRows },
    { title: 'Kelompok_Matkul', rows: kelompokRows },
    { title: 'Audit_Log', rows: auditRows }
  ];
}

/**
 * Generates and downloads a clean multi-sheet Excel (.xlsx) workbook
 * ready to be imported directly into Google Sheets or Microsoft Excel.
 */
export function exportClassToExcelWorkbook(
  data: SpreadsheetExportPayload
): { filename: string; tabNames: string[] } {
  const sheets = buildAllSpreadsheetSheets(data);
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const ws = makeSheet(sheet.rows);
    // Excel sheet name limit is 31 chars
    const safeTitle = sheet.title.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, ws, safeTitle);
  });

  const safeClass = (data.classDef.code || data.classDef.id || 'Kelas').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `KelasGue_${safeClass}_Spreadsheet_${dateStr}.xlsx`;

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 500);

  return {
    filename,
    tabNames: sheets.map(s => s.title)
  };
}
