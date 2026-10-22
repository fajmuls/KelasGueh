import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api.ts';
import { AuditLog } from '../../../types/index.ts';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Terminal,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" /> Audit Log & Rekam Jejak Keamanan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat kronologis seluruh aktivitas sensitif dan perubahan sistem oleh pengguna.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Muat Ulang Log
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pelaku, aksi, atau detail perubahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-blue-500"
          >
            <option value="all">Semua Tipe Aksi</option>
            <option value="UPDATE">Update Data</option>
            <option value="CREATE">Create / Tambah</option>
            <option value="DELETE">Delete / Hapus</option>
            <option value="VERIFY">Verifikasi Kas</option>
            <option value="VOTE">Suara Voting</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600" /> Catatan Audit Mutlak (Immutable Records)
          </h3>
          <span className="text-xs text-slate-400">Total {filteredLogs.length} Entri</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu (WIB)</th>
                <th className="p-3.5">Pengguna & Aktor</th>
                <th className="p-3.5">Tipe Aksi</th>
                <th className="p-3.5">Entitas / Modul</th>
                <th className="p-3.5">Detail Perubahan</th>
                <th className="p-3.5">Alamat IP / Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isDanger = log.action.includes('DELETE') || log.action.includes('ROLE');
                const isSuccess = log.action.includes('VERIFY') || log.action.includes('CREATE');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {log.user_name}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={isDanger ? 'danger' : isSuccess ? 'success' : 'primary'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{log.entity}</td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 inline-block max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {log.ip_address}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
