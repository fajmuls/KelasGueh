import React, { useState, useEffect } from 'react';
import { ClassDefinition, ClassMembershipRequest, UserProfile } from '../../types/kas.ts';
import { LocalKasRepository } from '../../services/supabaseClient.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin } from './DoodleDecorations.tsx';
import { showToast } from '../UI/DoodleDialog.tsx';
import { GraduationCap, Clock, RefreshCw, LogOut, CheckCircle2, Send, Users } from 'lucide-react';

interface ClassSelectionGateProps {
  user: UserProfile;
  accessStatus: 'pending' | 'unassigned';
  pendingRequest?: ClassMembershipRequest;
  availableClasses: ClassDefinition[];
  onRefreshAccess: () => Promise<void>;
  onLogout: () => void;
}

export const ClassSelectionGate: React.FC<ClassSelectionGateProps> = ({
  user,
  accessStatus,
  pendingRequest,
  availableClasses,
  onRefreshAccess,
  onLogout
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(() => availableClasses[0]?.id || '01_SAKP_014');
  const [fullName, setFullName] = useState<string>(user.name || '');
  const [nim, setNim] = useState<string>(user.nim || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);

  const activeSelectableClasses = availableClasses.filter(c => !c.isArchived);
  const selectableClasses = activeSelectableClasses.length > 0 ? activeSelectableClasses : availableClasses;

  useEffect(() => {
    if (selectableClasses.length > 0 && !selectableClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(selectableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = selectableClasses.find(c => c.id === selectedClassId) || selectableClasses[0];
    if (!targetClass) return;

    setIsSubmitting(true);
    try {
      sfx.playPaymentConfirmed();
      const res = await LocalKasRepository.submitClassJoinRequest({
        email: user.email,
        fullName: fullName.trim() || user.name,
        nim: nim.trim(),
        classId: targetClass.id,
        className: targetClass.name
      });
      if (res.status === 'approved' && res.autoMatched) {
        sfx.playCoinChime();
        showToast(
          `Cocok Nama & NIM! Anda otomatis diterima masuk ke kelas ${res.className}.`,
          'success'
        );
      } else {
        showToast(
          `Pengajuan masuk kelas ${targetClass.code} dikirim! Menunggu konfirmasi Super Admin.`,
          'success'
        );
      }
      setShowChangeForm(false);
      await onRefreshAccess();
    } catch (err: any) {
      showToast(`Gagal mengirim pengajuan: ${err?.message || 'Coba lagi'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    sfx.playClick();
    setIsChecking(true);
    try {
      await onRefreshAccess();
      showToast('Status persetujuan telah diperbarui dari server.', 'info');
    } finally {
      setIsChecking(false);
    }
  };

  const showPendingView = accessStatus === 'pending' && !showChangeForm;

  return (
    <div className="min-h-screen bg-paper-grid flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="max-w-lg w-full relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <PushPin className="w-8 h-8 text-amber-500 drop-shadow-md" />
        </div>

        <div className="card-doodle bg-[#FFFDF9] rounded-xl p-6 sm:p-8 relative">
          <ScotchTape className="absolute -top-3 -right-4 rotate-12" />

          <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-5 text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-slate-900 rounded-md text-[11px] font-black uppercase text-slate-900">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span>Verifikasi Keanggotaan Kelas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {showPendingView ? 'Menunggu Konfirmasi' : 'Pilih Kelas Tujuan Anda'}
            </h1>
            <p className="text-xs text-slate-600">
              Akun: <strong className="font-mono text-slate-900">{user.email}</strong>
            </p>
          </div>

          {showPendingView && pendingRequest ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-slate-900 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Pengajuan Masuk Kelas Sedang Ditinjau</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Permintaan Anda untuk bergabung ke kelas <strong className="text-slate-950">{pendingRequest.className}</strong> sudah dikirim ke Super Admin. Anda akan otomatis masuk setelah dikonfirmasi.
                </p>
                <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Nama Pengaju:</span>
                    <strong className="text-slate-900">{pendingRequest.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">NIM / Absen:</span>
                    <strong className="font-mono text-slate-900">{pendingRequest.nim || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={isChecking}
                  onClick={handleCheckStatus}
                  className="flex-1 btn-doodle px-4 py-2.5 min-h-[44px] bg-emerald-300 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Memeriksa...' : 'Cek Status Konfirmasi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setShowChangeForm(true);
                  }}
                  className="btn-doodle px-4 py-2.5 min-h-[44px] bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg"
                >
                  Ganti Kelas
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-slate-800">
                  Pilih Kelas Aktif Terbaru:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                  {selectableClasses.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          sfx.playOptionSelect();
                          setSelectedClassId(cls.id);
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-200 border-slate-900 shadow-[2px_2px_0px_#000]'
                            : 'bg-white border-slate-300 hover:border-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-amber-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-black text-sm text-slate-900 truncate">{cls.code}</p>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-200 border border-slate-900 text-emerald-950">
                                Semester Aktif
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate">{cls.academicYear}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-500 rounded-lg text-[11px] text-emerald-950 font-semibold leading-snug">
                💡 <strong>Validasi Otomatis:</strong> Jika <strong>Nama Lengkap &amp; NIM</strong> cocok dengan daftar mahasiswa pada kelas aktif terbaru, Anda akan otomatis langsung masuk tanpa menunggu konfirmasi!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap Mahasiswa *</label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sesuai daftar absen kelas"
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIM / No. Absen</label>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 230101001"
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-doodle py-3 min-h-[46px] bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses Pengajuan...' : 'Ajukan / Verifikasi Masuk Kelas'}</span>
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">Bukan akun Anda?</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-rose-700 hover:text-rose-900 font-black flex items-center gap-1 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
