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

export interface AdminSheetSyncPayload {
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

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedAt: string;
  tabNames: string[];
}

const ADMIN_SHEET_TABS = [
  'Ringkasan_Kelas',
  'Buku_Kas',
  'Siswa_Dan_Iuran',
  'Tagihan_Kolektif',
  'Keaktifan_Presensi',
  'Notulensi_Jadwal',
  'Kelompok_Matkul',
  'Audit_Log'
] as const;

export const getAdminSpreadsheetTabNames = (): readonly string[] => ADMIN_SHEET_TABS;

const formatCurrency = (val: number): number => Math.round(Number(val) || 0);

function buildAllSheetRows(data: AdminSheetSyncPayload): Array<{ title: string; rows: (string | number)[][] }> {
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
    ['Terakhir Sinkronisasi', nowStr, 'Auto/Manual Sync Google Sheets Admin'],
    ['Tarif Iuran Mingguan', formatCurrency(settings.weeklyDuesAmount), 'IDR / Minggu'],
    ['Target Kas Kelas', formatCurrency(settings.kasTargetAmount), 'IDR'],
    ['Total Pemasukan Kas', formatCurrency(totalIncome), `${transactions.filter(t => t.type === 'income').length} Transaksi`],
    ['Total Pengeluaran Kas', formatCurrency(totalExpense), `${transactions.filter(t => t.type === 'expense').length} Transaksi`],
    ['Saldo Kas Bersih', formatCurrency(netBalance), 'Pemasukan - Pengeluaran'],
    ['Total Siswa Aktif', activeMembers.length, `Dari total ${members.length} siswa terdaftar`],
    ['Jumlah Tagihan Kolektif', kolektifBills.length, 'Acara & Patungan'],
    ['Jumlah Sesi Presensi', attendanceRecords.length, 'Kuliah, Rapat & Kegiatan'],
    ['Jumlah Catatan Notulensi', meetingMinutes.length, 'Notulensi Rapat Kelas'],
    ['Jumlah Arsip Kelompok', savedGroups.length, 'Koleksi Pembagian Kelompok Matkul'],
    ['Jumlah Log Audit', auditLogs.length, 'Maksimal 200 log terbaru'],
    ['PIN Transaksi Besar', settings.requireTransactionPin !== false ? 'AKTIF' : 'NONAKTIF', `Batas Nominal: Rp ${formatCurrency(settings.transactionPinThreshold ?? 500000).toLocaleString('id-ID')}`]
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
      formatCurrency(tx.amount),
      tx.recordedBy || '-',
      tx.notes || '',
      tx.id
    ]);
  });

  // 3. Siswa_Dan_Iuran
  const siswaRows: (string | number)[][] = [
    ['No', 'Nama Siswa', 'NIM / Absen', 'Gender', 'Status', 'No. HP / WA', 'Minggu Lunas', 'Estimasi Total Iuran (IDR)', 'Daftar Minggu Lunas']
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
      formatCurrency(paidKeys.length * (settings.weeklyDuesAmount || 5000)),
      paidKeys.join(', ') || '-'
    ]);
  });

  // 4. Tagihan_Kolektif
  const kolektifRows: (string | number)[][] = [
    ['No', 'Judul Tagihan', 'Jenis', 'Kategori', 'Nominal Per Orang', 'Jatuh Tempo', 'Jumlah Peserta', 'Sudah Lunas', 'Total Terkumpul', 'Sinkron ke Kas']
  ];
  kolektifBills.forEach((b, idx) => {
    const paidCount = (b.paidMemberIds || []).length;
    kolektifRows.push([
      idx + 1,
      b.title,
      b.billType === 'patungan' ? 'Patungan' : 'Acara/Kolektif',
      b.category || '-',
      formatCurrency(b.amountPerPerson),
      b.dueDate || '-',
      (b.participantIds || []).length,
      paidCount,
      formatCurrency(paidCount * (b.amountPerPerson || 0)),
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
      p.points,
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

async function createFreshAdminSpreadsheet(
  accessToken: string,
  data: AdminSheetSyncPayload,
  sheetTabs: Array<{ title: string; rows: (string | number)[][] }>
): Promise<SheetSyncResult> {
  const title = `Kelas Gue Admin — ${data.classDef.code} (${data.classDef.academicYear})`;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetTabs.map(s => ({
        properties: {
          title: s.title,
          gridProperties: { frozenRowCount: 1 }
        }
      }))
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat Google Spreadsheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;
  const spreadsheetUrl: string =
    created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: sheetTabs.map(tab => ({
          range: `'${tab.title}'!A1`,
          majorDimension: 'ROWS',
          values: tab.rows
        }))
      })
    }
  );

  if (!batchRes.ok) {
    const err = await batchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Spreadsheet dibuat, tetapi gagal mengisi baris (${batchRes.status})`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    syncedAt: new Date().toISOString(),
    tabNames: sheetTabs.map(s => s.title)
  };
}

/**
 * Create 1 comprehensive Admin Spreadsheet or update existing spreadsheet tabs in-place.
 * Always checks existing sheet tab metadata first before updating/creating missing tabs.
 */
export async function syncClassToAdminSpreadsheet(
  accessToken: string,
  data: AdminSheetSyncPayload,
  existingSpreadsheetId?: string
): Promise<SheetSyncResult> {
  if (!accessToken) {
    throw new Error('Sesi Google Sheets belum aktif. Silakan otorisasi akun Google terlebih dahulu.');
  }

  const sheetTabs = buildAllSheetRows(data);

  if (!existingSpreadsheetId) {
    return createFreshAdminSpreadsheet(accessToken, data, sheetTabs);
  }

  // 1. Inspect existing spreadsheet metadata first (best practice per Google Sheets API guidelines)
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${existingSpreadsheetId}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (metaRes.status === 404) {
    // Spreadsheet was deleted or trashed; create a replacement cleanly
    return createFreshAdminSpreadsheet(accessToken, data, sheetTabs);
  }

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca metadata Spreadsheet (${metaRes.status})`);
  }

  const metaJson = await metaRes.json();
  const spreadsheetUrl: string =
    metaJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${existingSpreadsheetId}/edit`;
  const existingTitles = new Set<string>(
    (metaJson.sheets || []).map((s: any) => s.properties?.title).filter(Boolean)
  );

  // 2. Add any missing canonical tabs via batchUpdate
  const missingTabs = sheetTabs.filter(t => !existingTitles.has(t.title));
  if (missingTabs.length > 0) {
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${existingSpreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: missingTabs.map(t => ({
            addSheet: {
              properties: {
                title: t.title,
                gridProperties: { frozenRowCount: 1 }
              }
            }
          }))
        })
      }
    );
    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal menambahkan tab Spreadsheet (${addRes.status})`);
    }
  }

  // 3. Clear old tab values so deleted rows never linger
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${existingSpreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: sheetTabs.map(t => `'${t.title}'!A1:Z5000`)
      })
    }
  );

  // 4. Write all tabs cleanly in a single atomic batchUpdate
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${existingSpreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: sheetTabs.map(t => ({
          range: `'${t.title}'!A1`,
          majorDimension: 'ROWS',
          values: t.rows
        }))
      })
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal memperbarui data Google Sheets (${writeRes.status})`);
  }

  return {
    spreadsheetId: existingSpreadsheetId,
    spreadsheetUrl,
    syncedAt: new Date().toISOString(),
    tabNames: sheetTabs.map(s => s.title)
  };
}
