import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api.ts';
import { Payment, FinanceSummary } from '../../../types/index.ts';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Users,
  Bell,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';

export const ReportsModule: React.FC = () => {
  const [arrears, setArrears] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getArrearsReport(), api.getFinanceSummary()]).then(([arr, sum]) => {
      setArrears(arr);
      setSummary(sum);
      setIsLoading(false);
    });
  }, []);

  const totalTunggakanNominal = arrears.reduce((acc, p) => acc + p.amount, 0);

  const handleExportArrearsCSV = () => {
    const headers = ['NIM', 'Nama Mahasiswa', 'Tagihan', 'Nominal Tunggakan (Rp)', 'Status'];
    const rows = arrears.map((a) => [
      a.user_nim,
      `"${a.user_name}"`,
      `"${a.bill_title}"`,
      a.amount,
      a.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Rekap_Tunggakan_Kas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Rekap & Laporan Administrasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi keuangan kas, daftar tunggakan iuran mahasiswa, dan evaluasi operasional kelas.
          </p>
        </div>

        <button
          onClick={handleExportArrearsCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" /> Download Laporan Tunggakan CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Mahasiswa Menunggak
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">
            {arrears.length} Orang
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Belum melunasi iuran aktif</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Nominal Piutang Kas
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Rp {totalTunggakanNominal.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Potensi kas belum tertagih</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Kas Riil Terhimpun
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
            Rp {(summary?.balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ Berada di rekening bendahara</p>
        </div>
      </div>

      {/* Arrears List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Daftar Mahasiswa dengan Tunggakan Kas
          </h3>
          <span className="text-xs text-slate-400">{arrears.length} Data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mahasiswa</th>
                <th className="p-3.5">NIM</th>
                <th className="p-3.5">Tagihan Kas</th>
                <th className="p-3.5">Nominal</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {arrears.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-semibold text-slate-900">{a.user_name}</td>
                  <td className="p-3.5 font-mono text-slate-600">{a.user_nim}</td>
                  <td className="p-3.5 text-slate-800">{a.bill_title}</td>
                  <td className="p-3.5 font-bold text-rose-600">
                    Rp {a.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={a.status === 'pending' ? 'warning' : 'danger'}>
                      {a.status === 'pending' ? 'Menunggu Verifikasi' : 'Belum Bayar'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => alert(`Notifikasi pengingat pembayaran kas telah dikirimkan ke WhatsApp ${a.user_name}.`)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Bell className="w-3 h-3" /> Kirim Pengingat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
