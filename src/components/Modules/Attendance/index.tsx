import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { AttendanceRecord, User } from '../../../types/index.ts';
import {
  ClipboardCheck,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Check,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';
import { DynamicQrPresence } from './DynamicQrPresence.tsx';

export const AttendanceModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Kuliah Pemrograman Web - Pertemuan 3');
  const [sessionDate, setSessionDate] = useState('2026-09-08');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'permission' | 'sick' | 'absent'>>({});

  const loadData = async () => {
    try {
      const [att, mList] = await Promise.all([
        api.getAttendance(),
        api.getMembers(),
      ]);
      setRecords(att);
      setMembers(mList);

      const initialMap: Record<string, any> = {};
      mList.forEach((m) => {
        initialMap[m.id] = 'present';
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const batchRecords = members.map((m) => ({
        user_id: m.id,
        user_name: m.name,
        user_nim: m.nim,
        status: attendanceMap[m.id] || 'present',
        notes: '',
      }));

      await api.recordAttendance({
        title: sessionTitle,
        date: sessionDate,
        records: batchRecords,
      });

      setIsRecordModalOpen(false);
      await loadData();
      alert('Presensi kehadiran mahasiswa berhasil dicatat!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan presensi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" /> Presensi & Absensi Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kehadiran perkuliahan, praktikum laboratorium, dan musyawarah rapat kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <QrCode className="w-4 h-4 text-blue-600" /> Buka QR Presensi
          </button>

          {hasPermission('record_attendance') && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Input Presensi Sesi
            </button>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Presensi Mahasiswa</h3>
          <span className="text-xs text-slate-500">Total {records.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Mahasiswa</th>
                <th className="p-3.5">NIM</th>
                <th className="p-3.5">Status Kehadiran</th>
                <th className="p-3.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">{r.user_name}</td>
                  <td className="p-3.5 font-mono text-slate-600">{r.user_nim}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        r.status === 'present'
                          ? 'success'
                          : r.status === 'permission'
                          ? 'purple'
                          : r.status === 'sick'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {r.status === 'present'
                        ? 'Hadir'
                        : r.status === 'permission'
                        ? 'Izin'
                        : r.status === 'sick'
                        ? 'Sakit'
                        : 'Alpa'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-500">{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Presensi Massal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Input Presensi Mahasiswa"
        subtitle="Tentukan kehadiran mahasiswa untuk sesi perkuliahan"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Topik Sesi</label>
              <input
                type="text"
                required
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <label className="block font-semibold text-slate-700">Daftar Mahasiswa:</label>
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">NIM: {m.nim}</p>
                </div>

                <div className="flex items-center gap-1">
                  {(['present', 'permission', 'sick', 'absent'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAttendanceMap({ ...attendanceMap, [m.id]: st })}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                        (attendanceMap[m.id] || 'present') === st
                          ? st === 'present'
                            ? 'bg-emerald-600 text-white'
                            : st === 'permission'
                            ? 'bg-purple-600 text-white'
                            : st === 'sick'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {st === 'present' ? 'H' : st === 'permission' ? 'I' : st === 'sick' ? 'S' : 'A'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Simpan Presensi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal QR Code Dinamis */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Presensi QR Code Dinamis & Token Real-Time"
        subtitle="QR Code aman dengan rotasi token otomatis setiap 30 detik untuk mencegah titip absen atau foto QR"
      >
        <DynamicQrPresence
          sessionTitle={sessionTitle}
          sessionDate={sessionDate}
          members={members}
          onCheckInSuccess={async (studentName) => {
            await loadData();
          }}
        />
      </Modal>
    </div>
  );
};
