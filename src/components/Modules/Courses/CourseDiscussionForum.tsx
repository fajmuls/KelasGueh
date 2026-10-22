import React, { useState } from 'react';
import { Course, User } from '../../../types/index.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  MessageCircle,
  Tag,
  Search,
  Filter,
  Pin,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

interface CourseDiscussionForumProps {
  courses: Course[];
}

interface ForumThread {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  content: string;
  author_name: string;
  author_nim: string;
  created_at: string;
  category: 'Tugas' | 'UTS / UAS' | 'Catatan Kuliah' | 'Diskusi Umum';
  likes: number;
  liked_by_me: boolean;
  is_pinned?: boolean;
  replies: {
    id: string;
    author_name: string;
    author_nim: string;
    content: string;
    created_at: string;
    likes: number;
  }[];
}

const INITIAL_THREADS: ForumThread[] = [
  {
    id: 'thread-1',
    course_id: '1',
    course_name: 'Akuntansi Keuangan Menengah',
    title: 'Pembahasan Soal Jurnal Penyesuaian Obligasi & Amortisasi Premi',
    content: 'Teman-teman, untuk soal nomor 4 tugas minggu ini, metode amortisasi garis lurus atau bunga efektif yang digunakan sesuai arahan dosen di pertemuan terakhir ya?',
    author_name: 'Mochamad Rachman Faturochman',
    author_nim: '2310112001',
    created_at: '2 jam lalu',
    category: 'Tugas',
    likes: 8,
    liked_by_me: true,
    is_pinned: true,
    replies: [
      {
        id: 'rep-1',
        author_name: 'Ahmad Fauzi',
        author_nim: '2310112002',
        content: 'Pak Dosen kemarin konfirmasi gunakan metode suku bunga efektif (effective interest rate) ya teman-teman. Tabel amortisasinya disajikan per periode 6 bulanan.',
        created_at: '1 jam lalu',
        likes: 5,
      },
    ],
  },
  {
    id: 'thread-2',
    course_id: '2',
    course_name: 'Perpajakan Indonesia',
    title: 'Rangkuman Materi PPh Pasal 21 Tarif TER (Terbaru 2026)',
    content: 'Saya sudah merangkum tabel tarif TER kategori A, B, C untuk perhitungan PPh 21 bulanan dan SPT Masa. Silakan yang mau download ringkasan materi bisa cek lampiran di drive kelas!',
    author_name: 'Dewi Lestari',
    author_nim: '2310112003',
    created_at: 'Kemarin',
    category: 'Catatan Kuliah',
    likes: 15,
    liked_by_me: false,
    is_pinned: true,
    replies: [],
  },
  {
    id: 'thread-3',
    course_id: '3',
    course_name: 'Sistem Informasi Akuntansi',
    title: 'Kisi-kisi Ujian Tengah Semester (UTS) Flowchart Siklus Pendapatan',
    content: 'Ada yang punya referensi simbol DFD level 0 dan flowchart dokumen untuk modul siklus pendapatan & penagihan piutang?',
    author_name: 'Budi Santoso',
    author_nim: '2310112004',
    created_at: '3 hari lalu',
    category: 'UTS / UAS',
    likes: 6,
    liked_by_me: false,
    replies: [],
  },
];

export const CourseDiscussionForum: React.FC<CourseDiscussionForumProps> = ({ courses }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ForumThread[]>(INITIAL_THREADS);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Thread Modal
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [newThreadForm, setNewThreadForm] = useState({
    course_id: courses[0]?.id || '1',
    title: '',
    content: '',
    category: 'Tugas' as ForumThread['category'],
  });

  // Reply Input state
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(INITIAL_THREADS[0].id);

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadForm.title.trim() || !newThreadForm.content.trim()) return;

    const matchedCourse = courses.find((c) => c.id === newThreadForm.course_id);
    const newThread: ForumThread = {
      id: `thread-${Date.now()}`,
      course_id: newThreadForm.course_id,
      course_name: matchedCourse ? matchedCourse.name : 'Umum',
      title: newThreadForm.title,
      content: newThreadForm.content,
      author_name: user?.name || 'Mahasiswa Kelas',
      author_nim: user?.nim || '2310112001',
      created_at: 'Baru saja',
      category: newThreadForm.category,
      likes: 1,
      liked_by_me: true,
      replies: [],
    };

    setThreads([newThread, ...threads]);
    setIsNewThreadOpen(false);
    setNewThreadForm({
      course_id: courses[0]?.id || '1',
      title: '',
      content: '',
      category: 'Tugas',
    });
  };

  const handleToggleLike = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            likes: t.liked_by_me ? t.likes - 1 : t.likes + 1,
            liked_by_me: !t.liked_by_me,
          };
        }
        return t;
      })
    );
  };

  const handleSendReply = (threadId: string) => {
    const text = replyInputMap[threadId];
    if (!text || !text.trim()) return;

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const newRep = {
            id: `rep-${Date.now()}`,
            author_name: user?.name || 'Mahasiswa Kelas',
            author_nim: user?.nim || '2310112001',
            content: text.trim(),
            created_at: 'Baru saja',
            likes: 0,
          };
          return {
            ...t,
            replies: [...t.replies, newRep],
          };
        }
        return t;
      })
    );

    setReplyInputMap({ ...replyInputMap, [threadId]: '' });
  };

  // Filtered threads
  const filteredThreads = threads.filter((t) => {
    const matchCourse =
      selectedCourseFilter === 'all' || t.course_id === selectedCourseFilter;
    const matchCategory =
      selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
    const matchSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCourse && matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" /> Forum Tanya Jawab & Diskusi Kuliah
          </h3>
          <p className="text-slate-500 mt-0.5">
            Ruang diskusi terbuka antar mahasiswa dan asisten dosen untuk membahas tugas, materi ujian, dan catatan perkuliahan.
          </p>
        </div>

        <button
          onClick={() => setIsNewThreadOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Topik Diskusi</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari topik diskusi, tugas, atau nama penanya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Semua Mata Kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Semua Kategori</option>
            <option value="Tugas">Tugas Kuliah</option>
            <option value="UTS / UAS">Kisi-kisi UTS / UAS</option>
            <option value="Catatan Kuliah">Catatan & Rangkuman</option>
            <option value="Diskusi Umum">Diskusi Umum</option>
          </select>
        </div>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Belum ada topik diskusi</p>
            <p className="text-slate-400 text-xs mt-1">Jadilah yang pertama memulai pertanyaan atau berbagi catatan kuliah!</p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isExpanded = expandedThreadId === thread.id;

            return (
              <div
                key={thread.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-blue-200 transition-all space-y-4"
              >
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {thread.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Pin className="w-3 h-3" /> Disematkan
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {thread.course_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        {thread.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">• {thread.created_at}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{thread.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{thread.content}</p>
                  </div>
                </div>

                {/* Author & Stats Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {thread.author_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">{thread.author_name}</span>
                      <span className="text-slate-400 font-mono ml-1.5 text-[10px]">(NIM: {thread.author_nim})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLike(thread.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        thread.liked_by_me
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{thread.likes} Bermanfaat</span>
                    </button>

                    <button
                      onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{thread.replies.length} Jawaban</span>
                    </button>
                  </div>
                </div>

                {/* Replies Accordion */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/50 p-3.5 rounded-xl">
                    <h5 className="font-bold text-slate-800 text-xs">Jawaban & Tanggapan ({thread.replies.length}):</h5>

                    {thread.replies.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">Belum ada jawaban. Tulis tanggapan pertama di bawah!</p>
                    ) : (
                      <div className="space-y-2">
                        {thread.replies.map((rep) => (
                          <div key={rep.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800">{rep.author_name}</span>
                              <span className="text-slate-400 text-[10px]">{rep.created_at}</span>
                            </div>
                            <p className="text-slate-700 text-xs">{rep.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write Reply Box */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Tulis tanggapan / solusi jawaban..."
                        value={replyInputMap[thread.id] || ''}
                        onChange={(e) => setReplyInputMap({ ...replyInputMap, [thread.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(thread.id);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                      />
                      <button
                        onClick={() => handleSendReply(thread.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Buat Topik Baru */}
      <Modal
        isOpen={isNewThreadOpen}
        onClose={() => setIsNewThreadOpen(false)}
        title="Buat Topik Diskusi Baru"
        subtitle="Bagikan pertanyaan, soal latihan, atau rangkuman materi dengan teman sekelas"
      >
        <form onSubmit={handleCreateThread} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Mata Kuliah:</label>
            <select
              value={newThreadForm.course_id}
              onChange={(e) => setNewThreadForm({ ...newThreadForm, course_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Topik:</label>
              <select
                value={newThreadForm.category}
                onChange={(e) => setNewThreadForm({ ...newThreadForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="Tugas">Tugas Kuliah</option>
                <option value="UTS / UAS">Kisi-kisi UTS / UAS</option>
                <option value="Catatan Kuliah">Catatan & Rangkuman</option>
                <option value="Diskusi Umum">Diskusi Umum</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penulis:</label>
              <input
                type="text"
                disabled
                value={`${user?.name || 'Mahasiswa'} (${user?.nim || '2310112001'})`}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Diskusi:</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembahasan Soal Analisis Laporan Keuangan Bab 4"
              value={newThreadForm.title}
              onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detail Pertanyaan / Isi Catatan:</label>
            <textarea
              required
              rows={4}
              placeholder="Tuliskan pertanyaan, konteks tugas, atau tautan referensi materi..."
              value={newThreadForm.content}
              onChange={(e) => setNewThreadForm({ ...newThreadForm, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsNewThreadOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer shadow-xs"
            >
              Terbitkan Diskusi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
