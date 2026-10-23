import React, { useState } from 'react';
import { AuditLogEntry } from '../../services/supabaseClient.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleCrown, DoodleReceipt } from './DoodleDecorations.tsx';
import { Shield, Search, FileSpreadsheet, RefreshCw, Filter, CheckCircle2, User, Clock } from 'lucide-react';
import { downloadCsvFile } from '../../utils/exportToGoogleSheets.ts';

interface KasAuditLogProps {
  auditLogs: AuditLogEntry[];
  onRefreshLogs?: () => void;
}

export const KasAuditLog: React.FC<KasAuditLogProps> = ({ auditLogs, onRefreshLogs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filtered = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase());

    if (filterAction !== 'all') {
      if (filterAction === 'TRANSAKSI') return log.action.includes('TRANSAKSI');
      if (filterAction === 'IURAN') return log.action.includes('IURAN');
      if (filterAction === 'ROLE') return log.action.includes('ROLE');
      if (filterAction === 'SISTEM') return log.action.includes('SISTEM') || log.action.includes('PENGATURAN');
    }

    return matchesSearch;
  });

  const handleExportAuditCsv = () => {
    sfx.playFileDownload();
    let csv = `LAPORAN AUDIT LOG AKTIVITAS - KELAS GUE\n`;
    csv += `Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n\n`;
    csv += `No,Waktu,Tindakan Aksi,Rincian Detail,Pengubah (User),Role\n`;

    filtered.forEach((log, idx) => {
      const safeDetails = `"${log.details.replace(/"/g, '""')}"`;
      const dateStr = new Date(log.timestamp).toLocaleString('id-ID');
      csv += `${idx + 1},${dateStr},"${log.action}",${safeDetails},"${log.performedBy}","${log.userRole}"\n`;
    });

    downloadCsvFile(`laporan_audit_log_kelasgue_${Date.now()}.csv`, csv);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="card-doodle p-5 sm:p-6 rounded-lg bg-[#FFFDF9] relative">
        <ScotchTape className="absolute -top-3 left-10 rotate-1" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-amber-200 border border-slate-900 px-2 py-0.5 rounded-xs font-black text-slate-900">
                👑 Khusus Super Admin
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                Realtime Multi-User Audit Tracking
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-700" />
              <span>Laporan Audit Log Aktivitas Kas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Pencatatan riwayat setiap kali bendahara atau admin menambah, mengubah, mencentang iuran, atau menghapus data.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefreshLogs && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onRefreshLogs();
                }}
                className="btn-doodle px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-bold rounded-md flex items-center gap-1.5"
                title="Segarkan Log Terbaru"
              >
                <RefreshCw className="w-4 h-4 text-slate-700" />
                <span>Segarkan Log</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportAuditCsv}
              className="btn-doodle px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-1.5"
              title="Ekspor Laporan Audit Log ke File CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci aksi, rincian, atau nama pengubah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 border-2 border-slate-900 rounded-md">
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterAction('all');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterAction === 'all' ? 'bg-amber-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterAction('TRANSAKSI');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterAction === 'TRANSAKSI' ? 'bg-emerald-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Transaksi
            </button>
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterAction('IURAN');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterAction === 'IURAN' ? 'bg-sky-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Iuran
            </button>
            <button
              onClick={() => {
                sfx.playToggle();
                setFilterAction('ROLE');
              }}
              className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                filterAction === 'ROLE' ? 'bg-rose-300 border border-slate-900 text-slate-900' : 'text-slate-600'
              }`}
            >
              Role
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Notebook Table */}
      <div className="card-doodle rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 text-xs font-black uppercase text-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Waktu Stempel</th>
                <th className="py-3 px-4">Tindakan / Aksi</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
                <th className="py-3 px-4">Diubah Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans font-medium">
                    Belum ada catatan audit log aktivitas.
                  </td>
                </tr>
              ) : (
                filtered.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans font-bold">
                      <span className={`px-2 py-0.5 rounded border border-slate-900 text-[10px] ${
                        log.action.includes('CATAT') ? 'bg-emerald-200 text-emerald-950' :
                        log.action.includes('HAPUS') ? 'bg-rose-200 text-rose-950' :
                        log.action.includes('IURAN') ? 'bg-sky-200 text-sky-950' : 'bg-amber-200 text-amber-950'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{log.performedBy}</span>
                        <span className="text-[10px] bg-slate-100 border border-slate-300 px-1 py-0.2 rounded text-slate-600">
                          {log.userRole}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
