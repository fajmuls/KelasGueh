import React, { useState, useMemo } from 'react';
import { KasMember } from '../../../types/kas.ts';
import { autoDetectGenderByName } from '../../../utils/userManagement.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { Users, Shuffle, Copy, Check, Sparkles, UserCheck, Scale, Award } from 'lucide-react';

interface KelompokTabProps {
  members: KasMember[];
}

export const KelompokTab: React.FC<KelompokTabProps> = ({ members }) => {
  const [numGroups, setNumGroups] = useState<number>(4);
  const [mode, setMode] = useState<'campur' | 'seimbang_gender'>('seimbang_gender');
  const [seed, setSeed] = useState<number>(0); // Used to re-shuffle
  const [copied, setCopied] = useState<boolean>(false);

  // Compute gender for all members
  const processedMembers = useMemo(() => {
    return members.map(m => ({
      ...m,
      gender: m.gender || autoDetectGenderByName(m.name)
    }));
  }, [members]);

  const males = useMemo(() => processedMembers.filter(m => m.gender === 'L'), [processedMembers]);
  const females = useMemo(() => processedMembers.filter(m => m.gender === 'P'), [processedMembers]);

  // Shuffle algorithm
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Divide into groups based on seed and mode
  const groups = useMemo(() => {
    if (processedMembers.length === 0 || numGroups < 1) return [];

    const groupList: Array<{ id: number; name: string; members: typeof processedMembers }> = [];
    for (let i = 0; i < numGroups; i++) {
      groupList.push({ id: i + 1, name: `Kelompok ${i + 1}`, members: [] });
    }

    if (mode === 'campur') {
      const shuffled = shuffleArray(processedMembers);
      shuffled.forEach((member, index) => {
        const groupIndex = index % numGroups;
        groupList[groupIndex].members.push(member);
      });
    } else {
      // Seimbang Gender
      const shuffledMales = shuffleArray(males);
      const shuffledFemales = shuffleArray(females);

      shuffledMales.forEach((male, index) => {
        const groupIndex = index % numGroups;
        groupList[groupIndex].members.push(male);
      });

      // Distribute females starting from where males ended or reverse to keep balance
      shuffledFemales.forEach((female, index) => {
        const groupIndex = (numGroups - 1 - (index % numGroups));
        groupList[groupIndex].members.push(female);
      });
    }

    return groupList;
  }, [processedMembers, numGroups, mode, seed, males, females]);

  const handleShuffle = () => {
    sfx.playOptionSelect();
    setSeed(prev => prev + 1);
  };

  const handleCopyWhatsApp = () => {
    sfx.playFileDownload();
    let text = `📌 *PEMBAGIAN KELOMPOK KELAS*\nMode: ${mode === 'seimbang_gender' ? '⚖️ Seimbang Gender (L/P)' : '🎲 Acak Campur'}\nTotal Anggota: ${processedMembers.length} Mahasiswa\n\n`;

    groups.forEach((g) => {
      text += `*${g.name.toUpperCase()}* (${g.members.length} Orang)\n`;
      g.members.forEach((m, idx) => {
        const gBadge = m.gender === 'P' ? '[P]' : '[L]';
        text += `${idx + 1}. ${m.name} ${gBadge}\n`;
      });
      text += `\n`;
    });

    text += `_Dibuat otomatis via Aplikasi Kelas Gue_ ✨`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 sepia:bg-amber-100/60 border-2 border-amber-900/30 dark:border-amber-700/40 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center border border-amber-600/30 font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-950 dark:text-amber-100">
                Generator Pembagian Kelompok
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Bagi anggota kelas secara adil dengan opsi acak campur atau distribusi seimbang gender (L/P).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleShuffle}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
            >
              <Shuffle className="w-4 h-4" />
              Acak Ulang
            </button>

            <button
              onClick={handleCopyWhatsApp}
              disabled={groups.length === 0}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin ke WA'}
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-900 sepia:bg-amber-50/90 border-2 border-slate-200 dark:border-slate-800 sepia:border-amber-200/80 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jumlah Kelompok */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 sepia:text-amber-800 mb-2">
              Jumlah Kelompok: <span className="text-amber-600 dark:text-amber-400 text-sm">{numGroups} Kelompok</span>
            </label>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    sfx.playOptionSelect();
                    setNumGroups(n);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                    numGroups === n
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Distribusi */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 sepia:text-amber-800 mb-2">
              Metode Distribusi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sfx.playOptionSelect();
                  setMode('seimbang_gender');
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  mode === 'seimbang_gender'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Seimbang Gender (L/P)
              </button>

              <button
                onClick={() => {
                  sfx.playOptionSelect();
                  setMode('campur');
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  mode === 'campur'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Acak Campur Full
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 sepia:border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Total Laki-laki: <strong>{males.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-pink-500" /> Total Perempuan: <strong>{females.length}</strong>
            </span>
          </div>
          <span className="italic text-slate-500">
            Rata-rata: ~{Math.round(processedMembers.length / (numGroups || 1))} mahasiswa / kelompok
          </span>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((group) => {
          const groupMales = group.members.filter(m => m.gender === 'L').length;
          const groupFemales = group.members.filter(m => m.gender === 'P').length;

          return (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-900 sepia:bg-amber-50/90 border-2 border-slate-200 dark:border-slate-800 sepia:border-amber-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-400 transition"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 sepia:border-amber-200/50 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center">
                      #{group.id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {group.name}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {group.members.length} Orang
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {group.members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="text-xs py-1 px-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 sepia:bg-amber-100/40 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                        {idx + 1}. {m.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          m.gender === 'P'
                            ? 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300'
                            : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {m.gender === 'P' ? 'P' : 'L'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Rasio L/P:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {groupMales} 👦 | {groupFemales} 👧
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
