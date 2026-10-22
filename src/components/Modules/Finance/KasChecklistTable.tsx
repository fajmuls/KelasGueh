import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { KasCollectionColumn, KasChecklistEntry, User } from '../../../types/index.ts';
import {
  CheckSquare,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Wallet,
  Users,
  Download,
  FileSpreadsheet,
  Check,
  X,
  Clock,
  Filter,
  MessageCircle,
  Receipt,
  Send,
  Share2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { googleWorkspace } from '../../../services/googleWorkspace.ts';
import { exportKasReceiptToPDF } from '../../../utils/exportHelpers.ts';

export const KasChecklistTable: React.FC = () => {
  const { hasPermission, googleAccessToken, loginWithGoogle, classInfo, user } = useAuth();
  const [columns, setColumns] = useState<KasCollectionColumn[]>([]);
  const [entries, setEntries] = useState<KasChecklistEntry[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  // WhatsApp Broadcast Modal
  const [isWaBroadcastModalOpen, setIsWaBroadcastModalOpen] = useState(false);

  // Modal create column
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [newColForm, setNewColForm] = useState({
    title: `Kas Harian ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
    date: new Date().toISOString().split('T')[0],
    amount: '5000',
    period_type: 'weekly' as 'daily' | 'weekly' | 'custom',
  });

  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKasTable();
      setColumns(res.columns);
      setEntries(res.entries);
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to load Kas Table:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sort students alphabetically A to Z
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
  }, [students]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nim.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedStudents, searchQuery]);

  // Filter columns
  const filteredColumns = useMemo(() => {
    if (filterPeriod === 'all') return columns;
    return columns.filter((c) => c.period_type === filterPeriod);
  }, [columns, filterPeriod]);

  // Map entries for O(1) lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, KasChecklistEntry>();
    entries.forEach((e) => {
      map.set(`${e.column_id}_${e.user_id}`, e);
    });
    return map;
  }, [entries]);

  const handleToggle = async (column: KasCollectionColumn, student: User) => {
    const key = `${column.id}_${student.id}`;
    const currentEntry = entryMap.get(key);
    const nextPaid = !(currentEntry?.is_paid);

    setTogglingKey(key);
    try {
      // Optimistic update
      setEntries((prev) => {
        const idx = prev.findIndex(
          (e) => e.column_id === column.id && e.user_id === student.id
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            is_paid: nextPaid,
            paid_at: nextPaid ? new Date().toISOString() : undefined,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `ke_${column.id}_${student.id}`,
              column_id: column.id,
              user_id: student.id,
              user_name: student.name,
              user_nim: student.nim,
              is_paid: nextPaid,
              paid_amount: column.amount,
              paid_at: nextPaid ? new Date().toISOString() : undefined,
            },
          ];
        }
      });

      await api.toggleKasChecklist({
        column_id: column.id,
        user_id: student.id,
        is_paid: nextPaid,
      });
    } catch (err: any) {
      console.error('Failed to toggle checklist:', err);
      // Revert by refetching
      await loadData();
    } finally {
      setTogglingKey(null);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createKasColumn({
        title: newColForm.title,
        date: newColForm.date,
        amount: Number(newColForm.amount),
        period_type: newColForm.period_type,
      });
      setIsColModalOpen(false);
      setNewColForm({
        title: `Kas Harian ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
        date: new Date().toISOString().split('T')[0],
        amount: '5000',
        period_type: 'weekly',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat kolom kas');
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kolom kas ini beserta riwayat checklistnya?')) {
      return;
    }
    try {
      await api.deleteKasColumn(colId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kolom');
    }
  };

  const handleExportCSV = () => {
    const headers = ['No Absen', 'Nama Mahasiswa', 'NIM', ...filteredColumns.map((c) => `"${c.title} (${c.date})" - Rp ${c.amount}`), 'Total Terbayar (Rp)', 'Status'];
    const rows = sortedStudents.map((s, idx) => {
      let totalPaid = 0;
      const colStatuses = filteredColumns.map((c) => {
        const e = entryMap.get(`${c.id}_${s.id}`);
        if (e?.is_paid) {
          totalPaid += c.amount;
          return 'LUNAS (V)';
        }
        return 'BELUM (X)';
      });
      const allPaid = colStatuses.every((v) => v.includes('LUNAS'));
      return [
        idx + 1,
        `"${s.name}"`,
        s.nim,
        ...colStatuses,
        totalPaid,
        allPaid ? 'LUNAS SEMUA' : 'MENUNGGAK',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Tabel_Absensi_Kas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGoogleSheets = async () => {
    try {
      setIsExportingSheets(true);
      let token = googleAccessToken;
      if (!token) {
        await loginWithGoogle();
        token = googleAccessToken;
      }

      const headers = ['No Absen', 'Nama Mahasiswa', 'NIM', ...filteredColumns.map((c) => `${c.title} (Rp ${c.amount.toLocaleString('id-ID')})`), 'Total Terbayar (Rp)', 'Status'];
      const rows = sortedStudents.map((s, idx) => {
        let totalPaid = 0;
        const colStatuses = filteredColumns.map((c) => {
          const e = entryMap.get(`${c.id}_${s.id}`);
          if (e?.is_paid) {
            totalPaid += c.amount;
            return 'LUNAS';
          }
          return 'BELUM';
        });
        const allPaid = colStatuses.every((v) => v === 'LUNAS');
        return [
          idx + 1,
          s.name,
          s.nim,
          ...colStatuses,
          totalPaid,
          allPaid ? 'Lunas Semua' : 'Belum Lunas',
        ];
      });

      if (token) {
        const res = await googleWorkspace.createSpreadsheet(
          token,
          `Tabel Absensi Kas ${classInfo?.name || '01SAKP014'} - ${new Date().toLocaleDateString('id-ID')}`,
          [{ title: 'Tabel Kas Checklist', rows: [headers, ...rows] }]
        );
        alert(`Berhasil diekspor ke Google Sheets! URL: ${res.spreadsheetUrl}`);
        window.open(res.spreadsheetUrl, '_blank');
      } else {
        handleExportCSV();
        alert('File CSV telah diunduh. Masuk dengan Google untuk ekspor langsung ke Google Drive Sheets.');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      handleExportCSV();
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Overall metrics
  const totalTarget = filteredColumns.reduce((sum, c) => sum + c.amount * sortedStudents.length, 0);
  const totalCollected = entries
    .filter((e) => e.is_paid && filteredColumns.some((c) => c.id === e.column_id))
    .reduce((sum, e) => sum + e.paid_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Rekapitulasi Checklist Absensi Kas 1 - {sortedStudents.length}
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Tabel Kas & Absensi Pembayaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centang langsung kotak pembayaran kas harian/mingguan per mahasiswa. Data otomatis terhubung ke saldo kas dan transparansi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsWaBroadcastModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Kirim Notifikasi Tagihan WhatsApp ke Semua Mahasiswa Menunggak"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim Tagihan WA</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            disabled={isExportingSheets}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isExportingSheets ? 'Mengekspor...' : 'Google Sheets'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          {hasPermission('manage_payments') && (
            <button
              onClick={() => setIsColModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Kolom Kas
            </button>
          )}
        </div>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Terkumpul
            </span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              Rp {totalCollected.toLocaleString('id-ID')}
            </p>
            <span className="text-[11px] text-slate-400">
              Dari target Rp {totalTarget.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Anggota Terdaftar
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {sortedStudents.length} Mahasiswa
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">
              Absen urut abjad A s/d Z (1 - 39)
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Periode / Sesi Kas
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {filteredColumns.length} Kolom Aktif
            </p>
            <span className="text-[11px] text-slate-400">
              Harian, mingguan, & iuran rutin
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIM mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tipe Kas:
          </span>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-blue-500"
          >
            <option value="all">Semua Kolom Kas</option>
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="custom">Kustom</option>
          </select>
        </div>
      </div>

      {/* The Big Interactive Checklist Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
              <tr>
                <th className="p-3.5 text-center w-12 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">
                  No
                </th>
                <th className="p-3.5 min-w-[200px] sticky left-12 bg-slate-50 z-30 border-r border-slate-200">
                  Nama Mahasiswa & NIM
                </th>
                {filteredColumns.map((col) => {
                  const colPaidCount = entries.filter(
                    (e) => e.column_id === col.id && e.is_paid
                  ).length;
                  return (
                    <th
                      key={col.id}
                      className="p-3 text-center min-w-[130px] border-r border-slate-200 last:border-r-0 bg-slate-50/90"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {col.title}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold mt-0.5">
                          Rp {col.amount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(col.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {colPaidCount}/{sortedStudents.length}
                          </span>
                          {hasPermission('manage_payments') && (
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              title="Hapus Kolom Ini"
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
                <th className="p-3.5 text-right min-w-[120px] sticky right-0 bg-slate-50 z-20 border-l border-slate-200">
                  Total Terbayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={filteredColumns.length + 3}
                    className="p-8 text-center text-slate-400 text-xs"
                  >
                    Tidak ada mahasiswa yang cocok dengan pencarian "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  // Find original index in whole class for official absent number (1 to 39)
                  const absentNumber =
                    sortedStudents.findIndex((s) => s.id === student.id) + 1;

                  let studentTotalPaid = 0;
                  let studentUnpaidCount = 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* No Absen */}
                      <td className="p-3 text-center font-mono font-bold text-slate-600 sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 border-r border-slate-200">
                        {absentNumber}
                      </td>

                      {/* Mahasiswa Info */}
                      <td className="p-3 sticky left-12 bg-white group-hover:bg-blue-50/40 z-10 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-snug">
                              {student.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              NIM: {student.nim}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Columns Checkboxes */}
                      {filteredColumns.map((col) => {
                        const key = `${col.id}_${student.id}`;
                        const entry = entryMap.get(key);
                        const isPaid = Boolean(entry?.is_paid);
                        if (isPaid) studentTotalPaid += col.amount;
                        else studentUnpaidCount++;

                        const isToggling = togglingKey === key;

                        return (
                          <td
                            key={col.id}
                            className="p-2 text-center border-r border-slate-100 last:border-r-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggle(col, student)}
                              disabled={isToggling}
                              title={
                                isPaid
                                  ? `Sudah Lunas Rp ${col.amount.toLocaleString('id-ID')} (Klik untuk ubah)`
                                  : `Belum Bayar Rp ${col.amount.toLocaleString('id-ID')} (Klik untuk tandai lunas)`
                              }
                              className={`w-full py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 font-semibold text-[11px] cursor-pointer ${
                                isPaid
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border border-dashed border-slate-300'
                              } ${isToggling ? 'opacity-50 animate-pulse' : ''}`}
                            >
                              {isPaid ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Lunas</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px]">Belum</span>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Student Summary & Actions */}
                      <td className="p-3 text-right sticky right-0 bg-white group-hover:bg-blue-50/40 z-10 border-l border-slate-200">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-slate-900 block">
                            Rp {studentTotalPaid.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              studentUnpaidCount === 0
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {studentUnpaidCount === 0
                              ? '✓ Lunas Semua'
                              : `${studentUnpaidCount} belum bayar`}
                          </span>

                          <div className="flex items-center gap-1 mt-1 opacity-90 group-hover:opacity-100">
                            {studentUnpaidCount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const unpaidCols = filteredColumns.filter((c) => !entryMap.get(`${c.id}_${student.id}`)?.is_paid);
                                  const totalOwed = unpaidCols.reduce((sum, c) => sum + c.amount, 0);
                                  const colList = unpaidCols.map((c) => `• ${c.title} (Rp ${c.amount.toLocaleString('id-ID')})`).join('\n');
                                  const text = `Halo ${student.name} (${student.nim}),\n\nKami menginformasikan rekapan iuran kas kelas *${classInfo?.name || '01 SAKP 14'}*.\n\nSaat ini terdapat ${unpaidCols.length} tagihan kas yang belum diselesaikan:\n${colList}\n\n*Total Tagihan:* Rp ${totalOwed.toLocaleString('id-ID')}\n\nSilakan melakukan pembayaran tunai ke Bendahara Kelas atau transfer, lalu kirimkan bukti pembayarannya ya. Terima kasih! 🙏`;
                                  const phone = student.phone ? student.phone.replace(/[^0-9]/g, '') : '';
                                  const finalPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                                  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                title="Kirim Tagihan Kas ke WhatsApp Mahasiswa"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>Tagih WA</span>
                              </button>
                            )}

                            {studentTotalPaid > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const paidCols = filteredColumns.filter((c) => entryMap.get(`${c.id}_${student.id}`)?.is_paid);
                                  const paidTitle = paidCols.map((c) => c.title).join(', ');
                                  exportKasReceiptToPDF(
                                    {
                                      receiptNumber: `KWT-${student.nim.slice(-4)}-${Date.now().toString().slice(-4)}`,
                                      studentName: student.name,
                                      studentNim: student.nim,
                                      amount: studentTotalPaid,
                                      paymentFor: `Iuran Kas Kelas: ${paidTitle || 'Periode Berjalan'}`,
                                      paymentMethod: 'Transfer Bank / QRIS Kas Kelas',
                                      date: new Date().toISOString(),
                                      treasurerName: user?.name || 'Bendahara Kelas',
                                    },
                                    classInfo
                                  );
                                }}
                                title="Cetak / Unduh Kwitansi Digital Lunas"
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Receipt className="w-3 h-3 text-blue-600" />
                                <span>Kwitansi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Broadcast Tagihan WhatsApp */}
      <Modal
        isOpen={isWaBroadcastModalOpen}
        onClose={() => setIsWaBroadcastModalOpen(false)}
        title="Pengingat Tagihan Kas WhatsApp"
        subtitle="Daftar mahasiswa yang memiliki tunggakan kas kelas beserta format pesan siap kirim"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <p className="font-semibold">Perhatian Bendahara Kelas:</p>
            <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
              Klik tombol "Kirim WA" pada masing-masing mahasiswa di bawah untuk langsung membuka percakapan WhatsApp dengan teks penagihan sopan otomatis.
            </p>
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2 divide-y divide-slate-100">
            {sortedStudents
              .map((s) => {
                const unpaid = filteredColumns.filter((c) => !entryMap.get(`${c.id}_${s.id}`)?.is_paid);
                const totalOwed = unpaid.reduce((sum, c) => sum + c.amount, 0);
                return { student: s, unpaid, totalOwed };
              })
              .filter((item) => item.unpaid.length > 0)
              .map((item, idx) => (
                <div key={item.student.id} className="pt-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">
                      {idx + 1}. {item.student.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      NIM: {item.student.nim} • {item.unpaid.length} tunggakan ({item.unpaid.map((c) => c.title).join(', ')})
                    </p>
                    <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                      Total: Rp {item.totalOwed.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const colList = item.unpaid.map((c) => `• ${c.title} (Rp ${c.amount.toLocaleString('id-ID')})`).join('\n');
                      const text = `Halo ${item.student.name} (${item.student.nim}),\n\nKami menginformasikan rekapan iuran kas kelas *${classInfo?.name || '01 SAKP 14'}*.\n\nSaat ini terdapat ${item.unpaid.length} tagihan kas yang belum diselesaikan:\n${colList}\n\n*Total Tagihan:* Rp ${item.totalOwed.toLocaleString('id-ID')}\n\nSilakan melakukan pembayaran tunai ke Bendahara Kelas atau transfer, lalu kirimkan bukti pembayarannya ya. Terima kasih! 🙏`;
                      const phone = item.student.phone ? item.student.phone.replace(/[^0-9]/g, '') : '';
                      const finalPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsWaBroadcastModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Tambah Kolom Kas Baru */}
      <Modal
        isOpen={isColModalOpen}
        onClose={() => setIsColModalOpen(false)}
        title="Buat Kolom Kas / Periode Baru"
        subtitle="Menambahkan sesi kas baru yang siap di-checklist untuk seluruh 39 mahasiswa"
      >
        <form onSubmit={handleCreateColumn} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Sesi Kas
            </label>
            <input
              type="text"
              required
              value={newColForm.title}
              onChange={(e) =>
                setNewColForm({ ...newColForm, title: e.target.value })
              }
              placeholder="Contoh: Kas Harian 6 Sep 2026 atau Kas Minggu 1"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominal Iuran (Rp)
              </label>
              <input
                type="number"
                required
                min="500"
                value={newColForm.amount}
                onChange={(e) =>
                  setNewColForm({ ...newColForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipe Periode
              </label>
              <select
                value={newColForm.period_type}
                onChange={(e) =>
                  setNewColForm({
                    ...newColForm,
                    period_type: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="custom">Kustom / Acara</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal Pelaksanaan
            </label>
            <input
              type="date"
              required
              value={newColForm.date}
              onChange={(e) =>
                setNewColForm({ ...newColForm, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsColModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Simpan & Buka Kolom
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
