import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  DollarSign,
  Plus,
  Check,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { ClassInfo } from '../../types/index.ts';
import { createClassInFirestore } from '../../services/firestoreSync.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ClassSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingClasses: ClassInfo[];
  onClassSelected: (cls: ClassInfo) => void;
}

export const ClassSetupModal: React.FC<ClassSetupModalProps> = ({
  isOpen,
  onClose,
  existingClasses,
  onClassSelected,
}) => {
  const { setClassInfo } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>(
    existingClasses.length > 0 ? 'list' : 'create'
  );

  const [formData, setFormData] = useState({
    name: 'Kelas 01SAKP014',
    code: '01SAKP014',
    major: 'S1 Akuntansi',
    faculty: 'Fakultas Ekonomi dan Bisnis',
    academic_year: '2026/2027',
    semester: 'Semester 1 (Ganjil)',
    monthly_dues_amount: 20000,
    description: 'Kelas perkuliahan Program Studi S1 Akuntansi Kelas 01SAKP014.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Nama dan Kode Kelas wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createClassInFirestore({
        ...formData,
        monthly_dues_amount: Number(formData.monthly_dues_amount) || 20000,
      });

      setClassInfo(created);
      onClassSelected(created);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to create class:', err);
      alert('Terjadi kesalahan saat menyimpan kelas ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Kelas (Cloud Firestore)
              </h2>
              <p className="text-xs text-slate-500">
                Siapkan kelas dan tentukan jurusannya untuk mengelola mahasiswa & kas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (If classes exist) */}
        {existingClasses.length > 0 && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar Kelas ({existingClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Kelas Baru
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {saveSuccess && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Kelas berhasil disimpan dan disinkronkan ke Cloud Firestore!</span>
            </div>
          )}

          {activeTab === 'list' && existingClasses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Pilih kelas aktif yang ingin Anda kelola saat ini:
              </p>
              {existingClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => {
                    setClassInfo(cls);
                    onClassSelected(cls);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600">
                        {cls.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {cls.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {cls.major} • {cls.faculty}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tahun {cls.academic_year} • {cls.semester}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                    Pilih Kelas
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Data kelas akan disimpan langsung di <strong>Cloud Firestore</strong> sehingga otomatis sinkron antara Google AI Studio Preview dan aplikasi web di Vercel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Kelas 01SAKP014"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: 01SAKP014"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Program Studi / Jurusan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.major || ''}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Contoh: S1 Akuntansi"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Fakultas
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.faculty || ''}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    placeholder="Contoh: Fakultas Ekonomi dan Bisnis"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academic_year || ''}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="Contoh: 2026/2027"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Semester Aktif
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.semester || ''}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    placeholder="Contoh: Semester 1 (Ganjil)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Besaran Iuran Kas Bulanan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.monthly_dues_amount ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_dues_amount: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Kelas
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat mengenai kelas..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    'Menyimpan ke Firestore...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan & Sinkronkan ke Firestore
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
