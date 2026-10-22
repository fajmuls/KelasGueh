import React, { useState } from 'react';
import { User } from '../../../types/index.ts';
import {
  Crown,
  Shield,
  FileSpreadsheet,
  Wallet,
  Users,
  MessageCircle,
  Phone,
  Mail,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ClassOrgChartProps {
  members: User[];
}

interface OrgNode {
  title: string;
  roleDescription: string;
  badgeColor: string;
  defaultMemberNim?: string;
  defaultMemberName?: string;
  subordinates?: OrgNode[];
}

export const ClassOrgChart: React.FC<ClassOrgChartProps> = ({ members }) => {
  const [selectedOfficer, setSelectedOfficer] = useState<{
    title: string;
    description: string;
    member?: User;
  } | null>(null);

  // Match members by position or fallback
  const findMember = (roleKeywords: string[], defaultName: string) => {
    const found = members.find((m) =>
      roleKeywords.some(
        (kw) =>
          (m.position && m.position.toLowerCase().includes(kw.toLowerCase())) ||
          (m.name && m.name.toLowerCase().includes(kw.toLowerCase()))
      )
    );
    if (found) return found;
    // Return mock fallback from member list if available
    return {
      id: 'mock',
      name: defaultName,
      nim: '2310112001',
      email: `${defaultName.toLowerCase().replace(/\s+/g, '')}@student.ac.id`,
      phone: '08128002843',
      role_id: 'role_admin',
      position: roleKeywords[0],
      is_active: true,
      created_at: new Date().toISOString(),
    } as User;
  };

  const ketua = findMember(['ketua', 'rachman'], 'Mochamad Rachman Faturochman');
  const wakil = findMember(['wakil', 'fauzi'], 'Ahmad Fauzi');
  const sekretaris1 = findMember(['sekretaris 1', 'sekretaris', 'dewi'], 'Dewi Lestari');
  const sekretaris2 = findMember(['sekretaris 2', 'nita'], 'Nita Amelia');
  const bendahara1 = findMember(['bendahara 1', 'bendahara', 'rudi'], 'Rudi Hermawan');
  const bendahara2 = findMember(['bendahara 2', 'maya'], 'Maya Indah');

  const pjMatkul = [
    { name: 'Budi Santoso', matkul: 'Akuntansi Keuangan Menengah', phone: '0812999111' },
    { name: 'Siti Aminah', matkul: 'Perpajakan Indonesia', phone: '0812999222' },
    { name: 'Fikri Ramadhan', matkul: 'Sistem Informasi Akuntansi', phone: '0812999333' },
    { name: 'Nurul Hidayah', matkul: 'Statistika Bisnis', phone: '0812999444' },
  ];

  const renderOfficerCard = (
    title: string,
    member: User,
    colorScheme: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple',
    icon: React.ReactNode,
    description: string
  ) => {
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo ${member.name} (${title}), saya mahasiswa kelas 01SAKP014 ingin berkoordinasi.`)}` : '#';

    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50/40 hover:border-blue-400',
      indigo: 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-400',
      emerald: 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400',
      amber: 'border-amber-200 bg-amber-50/40 hover:border-amber-400',
      purple: 'border-purple-200 bg-purple-50/40 hover:border-purple-400',
    }[colorScheme];

    const badgeClasses = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
    }[colorScheme];

    return (
      <div
        className={`p-4 rounded-2xl border ${colorClasses} bg-white shadow-2xs transition-all hover:shadow-md flex flex-col justify-between text-left`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badgeClasses}`}>
              {icon}
              {title}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{member.nim}</span>
          </div>

          <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">{member.name}</h4>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{description}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {member.phone ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">{member.email}</span>
          )}

          <button
            onClick={() => setSelectedOfficer({ title, description, member })}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Tupoksi &rarr;
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 text-xs">
      {/* Overview Banner */}
      <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Struktur Kepengurusan Periode 2026 / 2027
          </div>
          <h3 className="text-lg font-black tracking-tight">Bagan Organisasi Kelas 01SAKP014</h3>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Susunan hirarki kepengurusan kelas yang bertugas mengoordinasikan perkuliahan, administrasi kas, komunikasi dosen, dan aspirasi seluruh mahasiswa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center">
            <span className="text-lg font-black text-amber-400">6</span>
            <p className="text-[10px] text-slate-300">Pengurus Inti</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center">
            <span className="text-lg font-black text-blue-400">8</span>
            <p className="text-[10px] text-slate-300">PJ Mata Kuliah</p>
          </div>
        </div>
      </div>

      {/* Level 1: Ketua & Wakil Kelas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Pimpinan Kelas (Presidium)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {renderOfficerCard(
            'Ketua Kelas (Komti)',
            ketua,
            'amber',
            <Crown className="w-3 h-3 text-amber-600" />,
            'Penanggung jawab utama seluruh kegiatan akademik, perwakilan resmi komunikasi dengan dosen dan prodi akuntansi.'
          )}

          {renderOfficerCard(
            'Wakil Ketua Kelas',
            wakil,
            'indigo',
            <Shield className="w-3 h-3 text-indigo-600" />,
            'Mendampingi ketua kelas, mengawasi kinerja seksi bidang, dan memimpin rapat koordinasi mingguan.'
          )}
        </div>
      </div>

      {/* Level 2: Sekretaris & Bendahara */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Pengurus Inti Administrasi & Keuangan</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderOfficerCard(
            'Sekretaris I',
            sekretaris1,
            'blue',
            <FileSpreadsheet className="w-3 h-3 text-blue-600" />,
            'Pencatatan presensi kehadiran, pembuatan notulensi rapat, dan arsip dokumen perkuliahan.'
          )}

          {renderOfficerCard(
            'Sekretaris II',
            sekretaris2,
            'blue',
            <FileSpreadsheet className="w-3 h-3 text-blue-600" />,
            'Pengelolaan rekapitulasi surat perizinan mahasiswa sakit/izin dan pengumuman kelas.'
          )}

          {renderOfficerCard(
            'Bendahara I',
            bendahara1,
            'emerald',
            <Wallet className="w-3 h-3 text-emerald-600" />,
            'Penarikan iuran kas bulanan, pencatatan mutasi kas masuk/keluar, dan laporan saldo bulanan.'
          )}

          {renderOfficerCard(
            'Bendahara II',
            bendahara2,
            'emerald',
            <Wallet className="w-3 h-3 text-emerald-600" />,
            'Penyusunan anggaran acara gathering kelas, kwitansi pembayaran, dan audit kas fisik.'
          )}
        </div>
      </div>

      {/* Level 3: Koordinator / PJ Mata Kuliah */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Penanggung Jawab (PJ) Mata Kuliah</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pjMatkul.map((pj, idx) => (
            <div key={idx} className="p-4 bg-white border border-purple-100 rounded-2xl shadow-2xs hover:border-purple-300 transition-all">
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold inline-block mb-1.5">
                PJ Matkul
              </span>
              <h5 className="font-bold text-slate-900 text-xs">{pj.name}</h5>
              <p className="text-[11px] text-purple-700 font-medium mt-0.5">{pj.matkul}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Koordinator Dosen</span>
                <a
                  href={`https://wa.me/62${pj.phone.slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  <MessageCircle className="w-3 h-3" /> Chat
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal Tupoksi */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  {selectedOfficer.title}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedOfficer.member?.name}</h3>
                <p className="text-slate-400 font-mono text-xs">NIM: {selectedOfficer.member?.nim}</p>
              </div>
              <button
                onClick={() => setSelectedOfficer(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Tugas Pokok & Fungsi (Tupoksi):</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{selectedOfficer.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOfficer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
