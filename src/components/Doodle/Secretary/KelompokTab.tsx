import React, { useState, useMemo } from 'react';
import { KasMember } from '../../../types/kas.ts';
import { autoDetectGenderByName } from '../../../utils/userManagement.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { toTitleCase } from '../../../utils/textFormatting.ts';
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
      name: toTitleCase(m.name),
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
    let text = `📌 *PEMBAGIAN KELOMPOK KELAS*\nMode: ${mode === 'seimbang_gender' ? '⚖️ Seimbang Gender (L/P)' : '🎲 Acak Campur'}\nTotal Anggota: ${processedMembers.length} Siswa\n\n`;

    groups.forEach((g) => {
      text += `*${g.name.toUpperCase()}* (${g.members.length} Orang)\n`;
      g.members.forEach((m, idx) => {
        const gBadge = m.gender === 'P' ? '[P]' : '[L]';
        text += `${idx + 1}. ${toTitleCase(m.name)} ${gBadge}\n`;
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
      <div className="bg-amber-100 border-3 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center border-2 border-slate-900 font-black shrink-0 shadow-[2px_2px_0px_#000]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                Generator Pembagian Kelompok
              </h3>
              <p className="text-xs text-slate-700 font-medium">
                Bagi anggota siswa kelas secara adil dengan opsi acak campur atau distribusi seimbang gender (L/P).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleShuffle}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition"
            >
              <Shuffle className="w-4 h-4" />
              Acak Ulang
            </button>

            <button
              onClick={handleCopyWhatsApp}
              disabled={groups.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:translate-y-0.5 text-slate-900 font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_#000] transition disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin ke WA'}
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#000] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jumlah Kelompok */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              Jumlah Kelompok: <span className="text-amber-600 text-sm">{numGroups} Kelompok</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[2, 3, 4, 5, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    sfx.playOptionSelect();
                    setNumGroups(n);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-slate-900 transition ${
                    numGroups === n
                      ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                      : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Distribusi */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              Metode Distribusi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sfx.playOptionSelect();
                  setMode('seimbang_gender');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 border-slate-900 flex items-center justify-center gap-1.5 transition ${
                  mode === 'seimbang_gender'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
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
                className={`py-2 px-3 rounded-xl text-xs font-black border-2 border-slate-900 flex items-center justify-center gap-1.5 transition ${
                  mode === 'campur'
                    ? 'bg-amber-400 text-slate-900 shadow-[1.5px_1.5px_0px_#000] -translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-amber-50 shadow-[1px_1px_0px_#000]'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Acak Campur Full
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="pt-3 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 font-bold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-blue-600" /> Total Laki-laki: <strong>{males.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-pink-600" /> Total Perempuan: <strong>{females.length}</strong>
            </span>
          </div>
          <span className="italic text-slate-500">
            Rata-rata: ~{Math.round(processedMembers.length / (numGroups || 1))} siswa / kelompok
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
              className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[3px_3px_0px_#000] flex flex-col justify-between hover:translate-y-[-2px] transition"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-300 border-2 border-slate-900 text-slate-900 font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_#000]">
                      #{group.id}
                    </span>
                    <h4 className="font-black text-sm text-slate-900">
                      {group.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg border-2 border-slate-900 bg-amber-100 text-amber-950">
                    {group.members.length} Orang
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {group.members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="text-xs py-1.5 px-2.5 rounded-lg bg-amber-50/60 border border-slate-900 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-900 truncate">
                        {idx + 1}. {toTitleCase(m.name)}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.2 rounded border border-slate-900 shrink-0 ${
                          m.gender === 'P'
                            ? 'bg-pink-200 text-pink-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {m.gender === 'P' ? 'P' : 'L'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-700 font-bold">
                <span>Rasio L/P:</span>
                <span className="font-black text-slate-900">
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
