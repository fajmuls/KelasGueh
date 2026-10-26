import React, { useState } from 'react';
import { AttendanceRecord, KasMember, ClassSettings } from '../../../types/kas.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { ScotchTape } from '../DoodleDecorations.tsx';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
import { toTitleCase } from '../../../utils/textFormatting.ts';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Plus,
  Trash2,
  Users,
  Search,
  CheckCheck
} from 'lucide-react';

interface PresensiTabProps {
  attendanceRecords: AttendanceRecord[];
  members: KasMember[];
  settings: ClassSettings;
  canEdit: boolean;
  onSaveRecord: (rec: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteRecord: (id: string) => void;
}

export const PresensiTab: React.FC<PresensiTabProps> = ({
  attendanceRecords,
  members,
  settings,
  canEdit,
  onSaveRecord,
  onDeleteRecord
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(attendanceRecords[0]?.id || '');
  const [searchMember, setSearchMember] = useState('');

  // Active or New Session form state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('Perkuliahan & Rapat Kelas');
  const [sessionType, setSessionType] = useState<'kuliah' | 'rapat' | 'kegiatan'>('kuliah');
  const [notes, setNotes] = useState('');
  const [statuses, setStatuses] = useState<Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'>>(() => {
    const init: Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'> = {};
    members.forEach(m => {
      init[m.id] = 'hadir';
    });
    return init;
  });

  const activeRecord = attendanceRecords.find(r => r.id === selectedRecordId);

  // When clicking on a historical record
  const handleSelectRecord = (rec: AttendanceRecord) => {
    sfx.playClick();
    setSelectedRecordId(rec.id);
    setDate(rec.date);
    setTitle(rec.title);
    setSessionType(rec.type);
    setNotes(rec.notes || '');
    setStatuses(rec.statuses || {});
  };

  const handleStartNewSession = () => {
    sfx.playClick();
    setSelectedRecordId('');
    setDate(new Date().toISOString().split('T')[0]);
    setTitle('Sesi Presensi Baru');
    setSessionType('kuliah');
    setNotes('');
    const fresh: Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'> = {};
    members.forEach(m => {
      fresh[m.id] = 'hadir';
    });
    setStatuses(fresh);
    showToast('Memulai pencatatan presensi sesi baru.', 'info');
  };

  const handleSetStatus = (memberId: string, status: 'hadir' | 'sakit' | 'izin' | 'alpa') => {
    if (!canEdit) return;
    sfx.playClick();
    setStatuses(prev => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSetAllHadir = () => {
    if (!canEdit) return;
    sfx.playToggle();
    const fresh: Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'> = {};
    members.forEach(m => {
      fresh[m.id] = 'hadir';
    });
    setStatuses(fresh);
    showToast('Seluruh siswa ditandai Hadir.', 'success');
  };

  const handleSaveCurrentSession = () => {
    if (!title.trim()) {
      showToast('Mohon masukkan nama/topik sesi presensi.', 'error');
      return;
    }
    sfx.playSuccess();
    onSaveRecord({
      id: selectedRecordId || undefined,
      date,
      title: title.trim(),
      type: sessionType,
      statuses,
      notes: notes.trim(),
      recordedBy: 'Sekretaris'
    });
    showToast('Presensi berhasil disimpan!', 'success');
  };

  const handleDeleteCurrentRecord = async () => {
    if (!selectedRecordId || !canEdit) return;
    const ok = await showConfirm({
      title: 'Hapus Sesi Presensi?',
      message: `Hapus arsip presensi tanggal ${date} (${title})?`,
      confirmLabel: 'Hapus Presensi',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeleteRecord(selectedRecordId);
      handleStartNewSession();
      showToast('Sesi presensi berhasil dihapus.', 'info');
    }
  };

  // WhatsApp Recap Generator
  const handleCopyWhatsAppAttendance = () => {
    sfx.playClick();

    const counts = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    const sickNames: string[] = [];
    const permitNames: string[] = [];
    const absentNames: string[] = [];

    members.forEach(m => {
      const st = statuses[m.id] || 'hadir';
      counts[st]++;
      if (st === 'sakit') sickNames.push(toTitleCase(m.name));
      if (st === 'izin') permitNames.push(toTitleCase(m.name));
      if (st === 'alpa') absentNames.push(toTitleCase(m.name));
    });

    const percent = members.length > 0 ? Math.round((counts.hadir / members.length) * 100) : 0;

    const message =
      `📋 *LAPORAN PRESENSI KELAS*\n` +
      `*${settings.className}*\n\n` +
      `📌 *Agenda/Topik:* ${title}\n` +
      `📅 *Tanggal:* ${date}\n` +
      `🏷️ *Jenis:* ${sessionType.toUpperCase()}\n` +
      `👥 *Total Siswa:* ${members.length}\n` +
      `📊 *Tingkat Kehadiran:* ${percent}%\n\n` +
      `✅ *Hadir:* ${counts.hadir} siswa\n` +
      `🤒 *Sakit (${counts.sakit}):* ${sickNames.join(', ') || '-'}\n` +
      `✉️ *Izin (${counts.izin}):* ${permitNames.join(', ') || '-'}\n` +
      `❌ *Alpa (${counts.alpa}):* ${absentNames.join(', ') || '-'}\n` +
      (notes ? `\n📝 *Catatan:* ${notes}\n` : '\n') +
      `_— Dicatat via Sekretariat Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Laporan presensi berhasil disalin untuk WhatsApp!', 'success');
  };

  // Counts for current state
  const counts = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  members.forEach(m => {
    const st = statuses[m.id] || 'hadir';
    counts[st]++;
  });

  const filteredMembers = members.filter(m => {
    if (!searchMember) return true;
    const q = searchMember.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 rounded">
                Ranah Sekretaris
              </span>
              <span className="text-xs font-bold text-slate-500">
                Pencatatan Kehadiran
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
              <span>Presensi Rapat & Kelas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Catat absensi pertemuan kuliah harian, musyawarah kelas, atau kerja kelompok. Cukup klik status hadir/izin/sakit/alpa untuk setiap siswa dan salin format laporan WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyWhatsAppAttendance}
              className="btn-doodle px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Salin Presensi WA</span>
            </button>

            {canEdit && (
              <button
                onClick={handleStartNewSession}
                className="btn-doodle px-3.5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Sesi Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Pill Selector */}
      {attendanceRecords.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {attendanceRecords.map(r => {
            const isSelected = selectedRecordId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRecord(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-sky-200 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{r.date}</span>
                <span className="text-[10px] text-slate-500 font-mono">({r.title.slice(0, 15)}...)</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Attendance Sheet Card */}
      <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] overflow-hidden">
        {/* Session Config Strip */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b-2 border-slate-900 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Topik / Agenda</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Misal: Pertemuan 5 Basis Data"
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Tanggal Sesi</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Jenis Pertemuan</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-900 bg-white"
              >
                <option value="kuliah">Kuliah Kelas</option>
                <option value="rapat">Rapat Internal Kelas</option>
                <option value="kegiatan">Kegiatan / Proyek Lapangan</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400">
                Hadir: <b>{counts.hadir}</b>
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-400">
                Izin: <b>{counts.izin}</b>
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-400">
                Sakit: <b>{counts.sakit}</b>
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-400">
                Alpa: <b>{counts.alpa}</b>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <>
                  <button
                    onClick={handleSetAllHadir}
                    className="btn-doodle px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-slate-900 rounded-md text-[11px] font-bold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Set Semua Hadir</span>
                  </button>

                  <button
                    onClick={handleSaveCurrentSession}
                    className="btn-doodle px-3.5 py-1 bg-amber-300 hover:bg-amber-200 text-slate-900 border-2 border-slate-900 rounded-md text-xs font-black shadow-[1.5px_1.5px_0px_#000]"
                  >
                    Simpan Presensi
                  </button>

                  {selectedRecordId && (
                    <button
                      onClick={handleDeleteCurrentRecord}
                      className="btn-doodle p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-slate-900 rounded-md text-xs"
                      title="Hapus arsip ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Member Search filter */}
        <div className="p-3 bg-white border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa dalam presensi..."
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs rounded-lg border border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Students Presence List */}
        <div className="p-4 bg-paper-grid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredMembers.map((member, idx) => {
              const currentStatus = statuses[member.id] || 'hadir';

              return (
                <div
                  key={member.id}
                  className="card-doodle p-3 rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#1E293B] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{idx + 1}.</span>
                      <p className="text-xs font-black text-slate-900 truncate">
                        {toTitleCase(member.name)}
                      </p>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 pl-4">
                      {member.studentId || 'Tanpa NIM'}
                    </p>
                  </div>

                  {/* Presence Selector Pills */}
                  <div className="flex items-center gap-1 shrink-0">
                    {(['hadir', 'izin', 'sakit', 'alpa'] as const).map(st => {
                      const isSelected = currentStatus === st;
                      const label = st === 'hadir' ? 'H' : st === 'izin' ? 'I' : st === 'sakit' ? 'S' : 'A';
                      const titleLabel = st === 'hadir' ? 'Hadir' : st === 'izin' ? 'Izin' : st === 'sakit' ? 'Sakit' : 'Alpa';

                      const activeColor =
                        st === 'hadir'
                          ? 'bg-emerald-500 text-white border-slate-900 shadow-[1px_1px_0px_#000]'
                          : st === 'izin'
                          ? 'bg-sky-500 text-white border-slate-900 shadow-[1px_1px_0px_#000]'
                          : st === 'sakit'
                          ? 'bg-amber-400 text-slate-900 border-slate-900 shadow-[1px_1px_0px_#000]'
                          : 'bg-rose-500 text-white border-slate-900 shadow-[1px_1px_0px_#000]';

                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={!canEdit}
                          title={titleLabel}
                          onClick={() => handleSetStatus(member.id, st)}
                          className={`w-7 h-7 rounded-lg text-xs font-black border transition-all flex items-center justify-center ${
                            isSelected
                              ? activeColor
                              : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              Tidak ada siswa yang sesuai filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
