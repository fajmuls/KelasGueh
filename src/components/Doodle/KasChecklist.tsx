import React, { useState } from 'react';
import { KasMember, ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { Check, X, Search, UserPlus, CheckCircle2 } from 'lucide-react';

interface KasChecklistProps {
  members: KasMember[];
  settings: ClassSettings;
  onToggleWeek: (memberId: string, weekKey: string) => void;
  onAddMember: (name: string, studentId: string) => void;
}

const WEEKS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];

export const KasChecklist: React.FC<KasChecklistProps> = ({
  members,
  settings,
  onToggleWeek,
  onAddMember,
}) => {
  const { canEditKas } = useAuth();
  const [search, setSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNim, setNewNim] = useState('');

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.studentId.includes(search)
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMember(newName.trim(), newNim.trim() || `230101${(members.length + 1).toString().padStart(3, '0')}`);
    sfx.playCoinChime();
    setNewName('');
    setNewNim('');
    setShowAddMember(false);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card-doodle p-5 rounded-lg bg-[#FFFDF9] relative">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span>Matriks Checklist Iuran Kas Mingguan</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Iuran per minggu: <strong className="text-slate-900">{formatRupiah(settings.weeklyDuesAmount)}</strong>.
              {canEditKas
                ? ' Klik kotak untuk menandai status lunas anggota.'
                : ' Mode transparansi: Periksa status pembayaran Anda secara mandiri.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEditKas && (
              <button
                onClick={() => {
                  sfx.playClick();
                  setShowAddMember(true);
                }}
                className="btn-doodle px-3.5 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold rounded-md flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Anggota</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama anggota atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
          />
        </div>
      </div>

      {/* Checklist Table */}
      <div className="card-doodle rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F2] border-b-2 border-slate-900 text-xs font-black uppercase text-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa / Mahasiswa</th>
                <th className="py-3 px-4 font-mono">NIM</th>
                {WEEKS.map(w => (
                  <th key={w} className="py-3 px-2 text-center font-mono w-14">
                    {w}
                  </th>
                ))}
                <th className="py-3 px-4 text-right font-mono">Total Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ditemukan anggota yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  // Calculate total weeks paid
                  const paidWeeks = WEEKS.filter(w => member.weeklyStatus[w]).length;
                  const totalPaid = paidWeeks * settings.weeklyDuesAmount;

                  return (
                    <tr key={member.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {member.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {member.studentId}
                      </td>

                      {/* Weekly checkboxes */}
                      {WEEKS.map(w => {
                        const isPaid = !!member.weeklyStatus[w];
                        return (
                          <td key={w} className="py-3 px-2 text-center">
                            {canEditKas ? (
                              <button
                                type="button"
                                onClick={() => {
                                  sfx.playCoinChime();
                                  onToggleWeek(member.id, w);
                                }}
                                title={`${member.name} - ${w}: ${isPaid ? 'Sudah Lunas' : 'Belum Bayar'}`}
                                className={`w-7 h-7 mx-auto rounded border-2 border-slate-900 flex items-center justify-center transition-all ${
                                  isPaid
                                    ? 'bg-emerald-400 text-slate-900 shadow-[1px_1px_0px_#1E293B]'
                                    : 'bg-white hover:bg-slate-100 text-transparent'
                                }`}
                              >
                                {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-[10px] text-slate-300">-</span>}
                              </button>
                            ) : (
                              <div
                                className={`w-7 h-7 mx-auto rounded border-2 border-slate-900 flex items-center justify-center ${
                                  isPaid ? 'bg-emerald-400 text-slate-900' : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums text-slate-900">
                        {formatRupiah(totalPaid)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-md w-full rounded-lg p-6 relative">
            <h3 className="text-xl font-black text-slate-900 mb-4 pb-2 border-b-2 border-slate-900">
              Tambah Anggota Kelas Baru
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kevin Sanjaya"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  NIM / No. Absen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 230101011"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border-2 border-slate-900 rounded-md text-sm font-bold bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-4 py-2 bg-amber-300 border-2 border-slate-900 rounded-md text-sm font-black text-slate-900"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
