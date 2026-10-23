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
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-600" /> Catatan Audit Mutlak
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">Total {filteredLogs.length} Entri</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] relative">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
              <tr>
                <th className="py-2 px-3">Waktu</th>
                <th className="py-2 px-3">Aktor</th>
                <th className="py-2 px-3">Aksi</th>
                <th className="py-2 px-3">Modul</th>
                <th className="py-2 px-3">Detail</th>
                <th className="py-2 px-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isDanger = log.action.includes('DELETE') || log.action.includes('ROLE');
                const isSuccess = log.action.includes('VERIFY') || log.action.includes('CREATE');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-slate-400" />
                        <span className="truncate max-w-[120px]">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black border ${isDanger ? 'bg-rose-50 text-rose-700 border-rose-100' : isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-slate-600">{log.entity}</td>
                    <td className="py-1.5 px-3">
                      <div className="text-[10px] text-slate-500 font-mono line-clamp-1 max-w-[200px]" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
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
