import React, { useState } from 'react';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { 
  Sparkles, 
  BookOpen, 
  Receipt, 
  CheckSquare, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

interface DoodleWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: any) => void;
}

export const DoodleWalkthrough: React.FC<DoodleWalkthroughProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Selamat Datang di Kelas Gue! 👋',
      subtitle: 'Buku Kas Kelas Transparan, Rapi & Modern',
      icon: Sparkles,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-100 text-amber-900',
      description: 'Aplikasi ini dirancang khusus untuk mempermudah bendahara dan siswa dalam mengelola keuangan kas kelas secara transparan dan akuntabel.',
      highlights: [
        'Pencatatan Pemasukan & Pengeluaran real-time',
        'Cetak Laporan PDF Resmi bertanda tangan & berstempel',
        'Fitur Split Bill / Kalkulator Pembagian Biaya Acara',
        'Notifikasi pengingat & Sinkronisasi Cloud otomatis'
      ],
      tabTarget: null
    },
    {
      title: '1. Menu Ringkasan Kas 📊',
      subtitle: 'Pantau Saldo Total & Kalkulator Split Bill',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-100 text-indigo-900',
      description: 'Halaman utama untuk melihat kondisi keuangan kas kelas secara keseluruhan dalam bentuk visual ringkas.',
      highlights: [
        'Saldo Kas Utama & Target Capaian Kas Semester',
        'Akses Cepat: Catat Transaksi, Cetak PDF, & Rekap WA',
        'Kalkulator Split Bill untuk patungan biaya acara kelas',
        'Grafik Arus Kas Pemasukan vs Pengeluaran'
      ],
      tabTarget: 'ringkasan'
    },
    {
      title: '2. Menu Buku Kas & Nota 🧾',
      subtitle: 'Riwayat Catatan Transaksi & Lampiran Foto Nota',
      icon: Receipt,
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-900',
      description: 'Buku jurnal pencatatan mutasi kas lengkap dengan fitur upload foto nota kuitansi sebagai bukti sah pengeluaran.',
      highlights: [
        'Fitur Filter berdasarkan Tanggal, Jenis, & Kategori',
        'Upload & Pratinjau Foto Kuitansi Pengeluaran',
        'Pencarian transaksi instan dengan kata kunci',
        'Setiap transaksi tercatat transparan dan bisa dicetak'
      ],
      tabTarget: 'bukukas'
    },
    {
      title: '3. Checklist Iuran Mingguan 📝',
      subtitle: 'Centang Pelunasan Kas Siswa Sekali Klik',
      icon: CheckSquare,
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-100 text-sky-900',
      description: 'Matriks pemantauan pembayaran iuran kas mingguan seluruh anggota kelas secara cepat dan akurat.',
      highlights: [
        'Klik centang kotak minggu untuk konfirmasi lunas',
        'Tercatat otomatis ke Buku Kas tanpa perlu ketik ulang',
        'Filter siswa belum lunas untuk penagihan instan',
        'Dukungan Mode Kartu Ringkas di layar Smartphone'
      ],
      tabTarget: 'checklist'
    },
    {
      title: '4. Laporan Audit & Pengaturan 🛡️',
      subtitle: 'Transparansi Penuh & Manajemen Akses',
      icon: ShieldCheck,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-900',
      description: 'Keamanan transaksi terjaga dengan PIN 6-digit serta laporan audit trail yang merekam setiap aktivitas pencatatan.',
      highlights: [
        'Whitelist Bendahara & Super Admin terverifikasi Google',
        'PIN Keamanan untuk transaksi pengeluaran besar',
        'Impor massal daftar siswa dari spreadsheet Excel / CSV',
        'Sistem backup & opsi Pembersihan Data Cache Lokal'
      ],
      tabTarget: 'pengaturan'
    }
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  const handleNext = () => {
    sfx.playClick();
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      if (onSelectTab && steps[nextStepIndex].tabTarget) {
        onSelectTab(steps[nextStepIndex].tabTarget as any);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sfx.playClick();
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      if (onSelectTab && steps[prevStepIndex].tabTarget) {
        onSelectTab(steps[prevStepIndex].tabTarget as any);
      }
    }
  };

  const handleComplete = () => {
    sfx.playSuccess();
    localStorage.setItem('kelasgue_walkthrough_completed_v1', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="card-doodle bg-[#FFFDF9] max-w-lg w-full rounded-xl p-5 sm:p-7 relative border-4 border-slate-900 shadow-[6px_6px_0px_#1E293B]">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-2deg]" />
        <ScotchTape className="absolute -top-3 right-10 rotate-[2deg]" />

        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playCardClose();
            handleComplete();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-slate-800 hover:bg-rose-100 hover:text-rose-700 transition-colors z-10"
          aria-label="Tutup panduan"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Step Indicator Badge */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border-2 border-slate-900 ${current.badgeBg}`}>
            Langkah {currentStep + 1} dari {steps.length}
          </span>

          <div className="flex items-center gap-1.5 pr-8">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sfx.playClick();
                  setCurrentStep(idx);
                  if (onSelectTab && steps[idx].tabTarget) {
                    onSelectTab(steps[idx].tabTarget as any);
                  }
                }}
                className={`h-2.5 rounded-full transition-all border border-slate-900 ${
                  idx === currentStep ? 'w-6 bg-amber-400' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Ke langkah ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Card Main Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#1E293B]">
            <StepIcon className={`w-6 h-6 ${current.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {current.title}
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Step Description Box */}
        <div className="bg-amber-50/70 border-2 border-slate-900 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {current.description}
          </p>

          <div className="pt-2 border-t border-slate-300/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Kemampuan & Fitur Utama:
            </p>
            <ul className="space-y-1.5">
              {current.highlights.map((h, i) => (
                <li key={i} className="text-xs text-slate-800 font-bold flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-slate-900">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`btn-doodle px-3.5 py-2 rounded-lg border-2 border-slate-900 text-xs font-bold flex items-center gap-1.5 ${
              currentStep === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <button
            onClick={handleNext}
            className="btn-doodle px-5 py-2.5 rounded-lg border-2 border-slate-900 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[2px_2px_0px_#1E293B]"
          >
            <span>{currentStep === steps.length - 1 ? 'Mulai Gunakan App! 🎉' : 'Lanjut'}</span>
            {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
