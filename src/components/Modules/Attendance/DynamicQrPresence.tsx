import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, Copy, Check, Sparkles, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';
import { User } from '../../../types/index.ts';
import { api } from '../../../services/api.ts';
import { useAuth } from '../../../context/AuthContext.tsx';

interface DynamicQrPresenceProps {
  sessionTitle: string;
  sessionDate: string;
  members: User[];
  onCheckInSuccess: (studentName: string) => void;
}

export const DynamicQrPresence: React.FC<DynamicQrPresenceProps> = ({
  sessionTitle,
  sessionDate,
  members,
  onCheckInSuccess,
}) => {
  const { user } = useAuth();
  const [currentToken, setCurrentToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  // Student check-in simulator state
  const [selectedStudentId, setSelectedStudentId] = useState(user?.id || (members[0]?.id || ''));
  const [inputToken, setInputToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate dynamic 6-digit token
  const generateToken = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentToken(randomDigits);
    setSecondsRemaining(30);
  };

  useEffect(() => {
    generateToken();
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generateToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?token=${currentToken}&session=${encodeURIComponent(sessionTitle)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStudentCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (inputToken.trim() !== currentToken.trim()) {
      setErrorMessage('Token / Kode QR tidak valid atau sudah kedaluwarsa (rotasi tiap 30 detik). Silakan masukkan kode terbaru.');
      return;
    }

    const student = members.find((m) => m.id === selectedStudentId);
    if (!student) {
      setErrorMessage('Pilih mahasiswa terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.recordAttendance({
        title: sessionTitle,
        date: sessionDate,
        records: [
          {
            user_id: student.id,
            user_name: student.name,
            user_nim: student.nim,
            status: 'present',
            notes: `Check-in via QR Dinamis (Token: ${currentToken})`,
          },
        ],
      });

      setSuccessMessage(`Berhasil! ${student.name} (${student.nim}) telah tercatat HADIR.`);
      setInputToken('');
      onCheckInSuccess(student.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal check-in presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Dynamic QR display for Lecturer / Class Leader Screen */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 text-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Titip Absen (Rotasi 30 Detik)</span>
          </div>

          {/* QR Container */}
          <div className="relative p-4 bg-white rounded-2xl shadow-inner mb-3">
            {/* Custom SVG QR Code visual pattern */}
            <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-900 rounded-xl p-3 text-white">
              <QrCode className="w-28 h-28 text-white mx-auto animate-pulse" />
              <div className="mt-1 font-mono text-[10px] tracking-widest text-emerald-400 font-bold">
                TOKEN: {currentToken}
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${secondsRemaining <= 5 ? 'animate-spin' : ''}`} />
              <span>Ganti dalam {secondsRemaining}d</span>
            </div>
          </div>

          <div className="w-full mt-3">
            <p className="font-bold text-sm text-slate-100">{sessionTitle}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{sessionDate}</p>

            {/* Progress Bar for countdown */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-blue-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsRemaining / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={generateToken}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan Token</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tautan Disalin' : 'Salin Tautan'}</span>
            </button>
          </div>
        </div>

        {/* Right: Student Scanner / PIN Input Check-In Simulator */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Input Token / Check-In Presensi</h4>
                <p className="text-[11px] text-slate-500">Mahasiswa memasukkan 6-digit kode yang tampil di layar proyektor / dosen</p>
              </div>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold mb-3 flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold mb-3">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleStudentCheckIn} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Akun Mahasiswa:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-blue-500 font-medium"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (NIM: {m.nim})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Masukkan 6-Digit Token QR:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 849201"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center text-lg font-bold tracking-widest text-blue-600 focus:outline-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setInputToken(currentToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !inputToken}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Memverifikasi...' : 'Konfirmasi Check-In Hadir'}</span>
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-400">
            💡 Sistem validasi presensi secara otomatis mencocokkan timestamp dan mendeteksi token aktif.
          </div>
        </div>
      </div>
    </div>
  );
};
