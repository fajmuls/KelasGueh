import React, { useState } from 'react';
import { MeetingMinute, KasMember, ClassSettings } from '../../../types/kas.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { ScotchTape, PushPin } from '../DoodleDecorations.tsx';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
import {
  FileText,
  Calendar,
  Share2,
  Plus,
  Trash2,
  CheckCircle,
  Copy,
  Printer,
  Mail,
  User,
  ListTodo,
  Sparkles
} from 'lucide-react';

interface NotulensiTabProps {
  meetingMinutes: MeetingMinute[];
  members: KasMember[];
  settings: ClassSettings;
  canEdit: boolean;
  onSaveMinute: (minute: Omit<MeetingMinute, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteMinute: (id: string) => void;
}

export const NotulensiTab: React.FC<NotulensiTabProps> = ({
  meetingMinutes,
  members,
  settings,
  canEdit,
  onSaveMinute,
  onDeleteMinute
}) => {
  const [activeMode, setActiveMode] = useState<'notulensi' | 'surat'>('notulensi');
  const [selectedMinuteId, setSelectedMinuteId] = useState<string>(meetingMinutes[0]?.id || '');
  const [isMinuteModalOpen, setIsMinuteModalOpen] = useState(false);

  // Minute Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leader, setLeader] = useState('Ketua Kelas');
  const [noteTaker, setNoteTaker] = useState('Sekretaris');
  const [agenda, setAgenda] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [decisions, setDecisions] = useState('');
  const [actionItems, setActionItems] = useState<{ id: string; task: string; assignee: string; done: boolean }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newAssigneeInput, setNewAssigneeInput] = useState('');

  // Surat Resmi Form State
  const [suratType, setSuratType] = useState<'izin' | 'undangan' | 'pengantar'>('izin');
  const [noSurat, setNoSurat] = useState(`01/KLS/${settings.className.replace(/\s+/g, '-').toUpperCase()}/X/2026`);
  const [tujuanSurat, setTujuanSurat] = useState('Yth. Dosen Pengampu Mata Kuliah');
  const [perihal, setPerihal] = useState('Permohonan Dispensasi / Izin Kegiatan');
  const [isiSurat, setIsiSurat] = useState(
    'Sehubungan dengan adanya kegiatan akademik kelas di luar kampus, kami bermaksud memohon izin dispensasi bagi mahasiswa yang terlampir.'
  );

  const activeMinute = meetingMinutes.find(m => m.id === selectedMinuteId) || meetingMinutes[0];

  const handleOpenAddMinute = () => {
    sfx.playClick();
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setLeader('Ketua Kelas');
    setNoteTaker('Sekretaris');
    setAgenda('');
    setDiscussion('');
    setDecisions('');
    setActionItems([]);
    setIsMinuteModalOpen(true);
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    sfx.playClick();
    setActionItems(prev => [
      ...prev,
      {
        id: `act_${Date.now()}`,
        task: newTaskInput.trim(),
        assignee: newAssigneeInput.trim() || 'Pengurus',
        done: false
      }
    ]);
    setNewTaskInput('');
    setNewAssigneeInput('');
  };

  const handleToggleTaskDone = (taskId: string) => {
    if (!activeMinute || !canEdit) return;
    sfx.playToggle();
    const updated = activeMinute.actionItems.map(item =>
      item.id === taskId ? { ...item, done: !item.done } : item
    );
    onSaveMinute({
      ...activeMinute,
      actionItems: updated
    });
  };

  const handleSaveMinuteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decisions.trim()) {
      showToast('Mohon lengkapi judul rapat dan poin keputusan.', 'error');
      return;
    }

    sfx.playSuccess();
    onSaveMinute({
      title: title.trim(),
      date,
      leader: leader.trim(),
      noteTaker: noteTaker.trim(),
      agenda: agenda.trim(),
      discussion: discussion.trim(),
      decisions: decisions.trim(),
      actionItems
    });

    showToast('Notulensi rapat berhasil disimpan!', 'success');
    setIsMinuteModalOpen(false);
  };

  const handleDeleteMinute = async (id: string) => {
    if (!canEdit) return;
    const ok = await showConfirm({
      title: 'Hapus Notulensi Rapat?',
      message: 'Apakah Anda yakin ingin menghapus arsip notulensi ini?',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeleteMinute(id);
      showToast('Notulensi berhasil dihapus.', 'info');
    }
  };

  // WhatsApp Recap for Minute
  const handleCopyMinuteWhatsApp = (minute: MeetingMinute) => {
    sfx.playClick();
    const actionList = minute.actionItems.length > 0
      ? minute.actionItems.map(a => `${a.done ? '☑️' : '◻️'} ${a.task} (PJ: ${a.assignee})`).join('\n')
      : '- Tidak ada tindak lanjut khusus -';

    const message =
      `📝 *NOTULENSI HASIL RAPAT KELAS*\n` +
      `*${settings.className}*\n\n` +
      `📌 *Topik Rapat:* ${minute.title}\n` +
      `📅 *Tanggal:* ${minute.date}\n` +
      `👤 *Pimpinan Rapat:* ${minute.leader}\n` +
      `✍️ *Notulis:* ${minute.noteTaker}\n\n` +
      `📋 *Agenda:*\n${minute.agenda || '-'}\n\n` +
      `💡 *Poin Pembahasan:*\n${minute.discussion || '-'}\n\n` +
      `⚖️ *KEPUTUSAN BERSAMA:*\n${minute.decisions}\n\n` +
      `🎯 *Tindak Lanjut / Action Items:*\n${actionList}\n\n` +
      `_— Dicatat via Sekretariat Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Teks notulensi berhasil disalin untuk WhatsApp!', 'success');
  };

  // WhatsApp Copy for Official Letter
  const handleCopySurat = () => {
    sfx.playClick();
    const fullLetter =
      `*SURAT RESMI KELAS*\n` +
      `*${settings.className}*\n` +
      `------------------------------------\n` +
      `Nomor   : ${noSurat}\n` +
      `Lampiran: -\n` +
      `Perihal : ${perihal}\n\n` +
      `Kepada:\n${tujuanSurat}\nDi Tempat\n\n` +
      `Dengan hormat,\n\n` +
      `${isiSurat}\n\n` +
      `Demikian surat ini kami sampaikan. Atas perhatian dan kebijaksanaannya, kami ucapkan terima kasih.\n\n` +
      `${settings.className}, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\n\n` +
      `Mengetahui,\n` +
      `*Ketua Kelas*                *Sekretaris Kelas*`;

    navigator.clipboard.writeText(fullLetter);
    showToast('Teks format surat resmi berhasil disalin!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />
        <PushPin className="top-3 right-4 absolute" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 rounded">
                Ranah Sekretaris
              </span>
              <span className="text-xs font-bold text-slate-500">
                Dokumentasi & Administrasi
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-700" />
              <span>Notulensi Rapat & Format Surat</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Arsipkan keputusan musyawarah kelas beserta daftar tugas tindak lanjutnya, dan buat format surat resmi kelas (izin/dispensasi, undangan, pengantar) siap pakai.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && activeMode === 'notulensi' && (
              <button
                onClick={handleOpenAddMinute}
                className="btn-doodle px-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Notulensi Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-2">
        <button
          onClick={() => {
            sfx.playToggle();
            setActiveMode('notulensi');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all flex items-center gap-2 ${
            activeMode === 'notulensi'
              ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#000] -translate-y-0.5'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Notulensi Musyawarah Rapat</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white rounded-full border border-slate-400">
            {meetingMinutes.length}
          </span>
        </button>

        <button
          onClick={() => {
            sfx.playToggle();
            setActiveMode('surat');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all flex items-center gap-2 ${
            activeMode === 'surat'
              ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#000] -translate-y-0.5'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Generator Format Surat Resmi</span>
        </button>
      </div>

      {/* VIEW 1: NOTULENSI RAPAT */}
      {activeMode === 'notulensi' && (
        <div className="space-y-4">
          {/* Minutes Pills Selector */}
          {meetingMinutes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {meetingMinutes.map(m => {
                const isSelected = activeMinute?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedMinuteId(m.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-sky-200 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-sky-50'
                    }`}
                  >
                    <span>{m.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({m.date})</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeMinute ? (
            <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] p-5 sm:p-6 space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeMinute.date} · Dipimpin oleh: {activeMinute.leader} · Notulis: {activeMinute.noteTaker}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {activeMinute.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyMinuteWhatsApp(activeMinute)}
                    className="btn-doodle px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#1E293B]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Salin Notulensi WA</span>
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => handleDeleteMinute(activeMinute.id)}
                      className="btn-doodle p-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-[1px_1px_0px_#1E293B]"
                      title="Hapus notulensi ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Agenda & Discussion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FFFDF5] p-4 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Agenda Rapat
                  </p>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {activeMinute.agenda || '-'}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-900 space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Poin Pembahasan
                  </p>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {activeMinute.discussion || '-'}
                  </p>
                </div>
              </div>

              {/* Decisions Box */}
              <div className="bg-amber-50 p-4 rounded-xl border-2 border-slate-900 space-y-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Keputusan Musyawarah
                </p>
                <div className="text-xs text-slate-900 font-semibold whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-300">
                  {activeMinute.decisions}
                </div>
              </div>

              {/* Action Items List */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-sky-600" />
                  Tindak Lanjut & Tugas Pengurus
                </p>

                <div className="space-y-1.5">
                  {activeMinute.actionItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleTaskDone(item.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer select-none transition-all ${
                        item.done
                          ? 'bg-slate-100 text-slate-500 border-slate-300 line-through'
                          : 'bg-white text-slate-900 border-slate-900 font-bold hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          item.done ? 'bg-emerald-500 text-white border-emerald-600' : 'border-slate-400 bg-white'
                        }`}>
                          {item.done ? '✓' : ''}
                        </span>
                        <span>{item.task}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                        PJ: {item.assignee}
                      </span>
                    </div>
                  ))}

                  {activeMinute.actionItems.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Tidak ada tindak lanjut khusus.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-doodle bg-white p-8 rounded-2xl border-2 border-slate-900 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-slate-800">Belum Ada Notulensi Rapat</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Mulai catat musyawarah kelas pertama Anda untuk menyimpan keputusan dan pembagian tugas bersama.
              </p>
              {canEdit && (
                <button
                  onClick={handleOpenAddMinute}
                  className="btn-doodle px-4 py-2 bg-amber-300 text-slate-900 font-bold text-xs rounded-xl border-2 border-slate-900"
                >
                  + Catat Notulensi Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: GENERATOR SURAT RESMI */}
      {activeMode === 'surat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Input Form */}
          <div className="card-doodle bg-white rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-600" />
                <span>Pengaturan Surat Kelas</span>
              </h3>
              <div className="flex items-center gap-1">
                {(['izin', 'undangan', 'pengantar'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSuratType(t);
                      if (t === 'izin') {
                        setPerihal('Permohonan Dispensasi / Izin Mahasiswa');
                        setIsiSurat('Sehubungan dengan pelaksanaan kegiatan kelas di luar kampus, kami bermaksud memohon izin dispensasi tidak mengikuti perkuliahan pada tanggal yang ditentukan.');
                      } else if (t === 'undangan') {
                        setPerihal('Undangan Musyawarah Rapat Kelas');
                        setIsiSurat('Dengan ini kami mengundang seluruh rekan mahasiswa dan pengurus untuk menghadiri musyawarah pembahasan agenda kelas.');
                      } else {
                        setPerihal('Surat Pengantar Kegiatan & Proposal');
                        setIsiSurat('Bersama surat ini kami sampaikan pengantar pelaksanaan kegiatan kelas demi kelancaran administrasi akademik.');
                      }
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      suratType === t
                        ? 'bg-amber-300 border-slate-900 text-slate-900 font-black'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    {t === 'izin' ? 'Izin' : t === 'undangan' ? 'Undangan' : 'Pengantar'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Surat</label>
                <input
                  type="text"
                  value={noSurat}
                  onChange={e => setNoSurat(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono font-bold rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ditujukan Kepada</label>
                <input
                  type="text"
                  value={tujuanSurat}
                  onChange={e => setTujuanSurat(e.target.value)}
                  placeholder="Misal: Yth. Dosen Wali / Pembina Kelas"
                  className="w-full px-3 py-1.5 font-bold rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Perihal</label>
                <input
                  type="text"
                  value={perihal}
                  onChange={e => setPerihal(e.target.value)}
                  className="w-full px-3 py-1.5 font-bold rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Isi Utama Surat</label>
                <textarea
                  rows={4}
                  value={isiSurat}
                  onChange={e => setIsiSurat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-white leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleCopySurat}
                className="w-full btn-doodle py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000] flex items-center justify-center gap-2 text-xs"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Teks Format Surat</span>
              </button>
            </div>
          </div>

          {/* Right: Live Preview Box */}
          <div className="card-doodle bg-[#FFFDF9] rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] p-6 space-y-4 font-serif text-slate-900 text-xs leading-relaxed relative">
            <ScotchTape className="-top-3 right-8 rotate-1" />

            {/* Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-3 font-sans">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                PENGURUS KELAS {settings.className.toUpperCase()}
              </h4>
              <p className="text-[10px] text-slate-600 font-semibold">
                Tahun Akademik {settings.academicYear || '2026/2027'}
              </p>
            </div>

            {/* Meta */}
            <div className="space-y-0.5 font-mono text-[11px]">
              <p>Nomor   : {noSurat}</p>
              <p>Perihal : <b>{perihal}</b></p>
            </div>

            <div>
              <p>Kepada Yth.</p>
              <p className="font-bold">{tujuanSurat}</p>
              <p>di Tempat</p>
            </div>

            <p>Dengan hormat,</p>

            <p className="indent-4 text-justify">
              {isiSurat}
            </p>

            <p className="indent-4">
              Demikian surat ini kami sampaikan, atas perhatian dan kebijaksanaan Bapak/Ibu kami mengucapkan terima kasih.
            </p>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-2 text-center font-sans text-[11px]">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Ketua Kelas</p>
                <div className="h-12" />
                <p className="font-bold underline">( ............................ )</p>
              </div>

              <div>
                <p>Hormat kami,</p>
                <p className="font-bold">Sekretaris Kelas</p>
                <div className="h-12" />
                <p className="font-bold underline">( ............................ )</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Notulensi Baru */}
      {isMinuteModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="card-doodle bg-white w-full max-w-xl rounded-2xl border-3 border-slate-900 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black text-slate-900">Catat Notulensi Rapat Baru</h3>
              </div>
              <button
                onClick={() => setIsMinuteModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMinuteSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Judul Rapat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Rapat Koordinasi Makrab & Evaluasi UTS"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-amber-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pimpinan</label>
                  <input
                    type="text"
                    value={leader}
                    onChange={e => setLeader(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Notulis</label>
                  <input
                    type="text"
                    value={noteTaker}
                    onChange={e => setNoteTaker(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Agenda Rapat</label>
                <textarea
                  rows={2}
                  placeholder="Daftar agenda yang dibahas..."
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Poin Diskusi & Masukan</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan argumen, usulan siswa..."
                  value={discussion}
                  onChange={e => setDiscussion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Keputusan Musyawarah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Lokasi kegiatan di Villa X&#10;2. Biaya disepakati Rp 50.000..."
                  value={decisions}
                  onChange={e => setDecisions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-amber-50/50"
                />
              </div>

              {/* Action items builder */}
              <div className="space-y-1.5 border-t border-slate-200 pt-2">
                <label className="font-bold text-slate-700 block">Tindak Lanjut / Action Items</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tugas..."
                    value={newTaskInput}
                    onChange={e => setNewTaskInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-400 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Penanggung Jawab"
                    value={newAssigneeInput}
                    onChange={e => setNewAssigneeInput(e.target.value)}
                    className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-400 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="btn-doodle px-3 py-1.5 bg-sky-200 text-slate-900 font-bold rounded-lg border border-slate-900 text-xs"
                  >
                    + Tambah
                  </button>
                </div>

                {actionItems.length > 0 && (
                  <div className="space-y-1 pt-1 max-h-28 overflow-y-auto">
                    {actionItems.map(item => (
                      <div key={item.id} className="p-1.5 rounded bg-slate-100 flex items-center justify-between text-xs">
                        <span>{item.task}</span>
                        <span className="font-mono text-[10px] text-slate-500">PJ: {item.assignee}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMinuteModalOpen(false)}
                  className="btn-doodle px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#000]"
                >
                  Simpan Notulensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
