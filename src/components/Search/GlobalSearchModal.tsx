import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Users, Calendar, Megaphone, FileText, DollarSign, CheckSquare, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.ts';
import { User, EventItem, Announcement, DocumentItem, Transaction, TaskItem } from '../../types/index.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([
        api.getMembers().catch(() => []),
        api.getEvents().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getDocuments().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getTasks().catch(() => []),
      ]).then(([m, e, a, d, t, tsk]) => {
        setMembers(m);
        setEvents(e);
        setAnnouncements(a);
        setDocuments(d);
        setTransactions(t);
        setTasks(tsk);
        setIsLoading(false);
      });
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    return {
      members: members.filter(m => m.name.toLowerCase().includes(q) || m.nim.includes(q)).slice(0, 4),
      events: events.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)).slice(0, 4),
      announcements: announcements.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)).slice(0, 4),
      documents: documents.filter(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)).slice(0, 4),
      transactions: transactions.filter(t => t.description.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)).slice(0, 4),
      tasks: tasks.filter(tsk => tsk.title.toLowerCase().includes(q) || tsk.assignee_name?.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, members, events, announcements, documents, transactions, tasks]);

  if (!isOpen) return null;

  const totalResults = results
    ? results.members.length + results.events.length + results.announcements.length + results.documents.length + results.transactions.length + results.tasks.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari anggota, agenda, pengumuman, kas, dokumen, atau tugas..."
            autoFocus
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-slate-400 bg-slate-200/80 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Memuat basis data pencarian...</div>
          ) : !query.trim() ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Ketik kata kunci untuk mencari di seluruh modul kelas.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Tidak ada data yang cocok dengan "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Members */}
              {results!.members.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Anggota ({results!.members.length})
                  </div>
                  <div className="space-y-1">
                    {results!.members.map(m => (
                      <div
                        key={m.id}
                        onClick={() => { onNavigate('members'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img src={m.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{m.name}</p>
                            <p className="text-xs text-slate-500">NIM: {m.nim} • {m.role_name}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agenda */}
              {results!.events.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Agenda & Kalender ({results!.events.length})
                  </div>
                  <div className="space-y-1">
                    {results!.events.map(e => (
                      <div
                        key={e.id}
                        onClick={() => { onNavigate('agenda'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{e.title}</p>
                          <p className="text-xs text-slate-500">{e.date} • {e.location}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements */}
              {results!.announcements.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" /> Pengumuman ({results!.announcements.length})
                  </div>
                  <div className="space-y-1">
                    {results!.announcements.map(a => (
                      <div
                        key={a.id}
                        onClick={() => { onNavigate('announcements'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{a.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{a.content}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              {results!.transactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Transaksi Kas ({results!.transactions.length})
                  </div>
                  <div className="space-y-1">
                    {results!.transactions.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { onNavigate('finance'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{t.description}</p>
                          <p className="text-xs text-slate-500">{t.code} • Rp {t.amount.toLocaleString('id-ID')}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {results!.documents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-violet-600" /> Dokumen ({results!.documents.length})
                  </div>
                  <div className="space-y-1">
                    {results!.documents.map(d => (
                      <div
                        key={d.id}
                        onClick={() => { onNavigate('documents'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-500">Kategori: {d.category} • {d.file_size}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results!.tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <CheckSquare className="w-3.5 h-3.5 text-rose-600" /> Tugas ({results!.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {results!.tasks.map(tsk => (
                      <div
                        key={tsk.id}
                        onClick={() => { onNavigate('tasks'); onClose(); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{tsk.title}</p>
                          <p className="text-xs text-slate-500">PIC: {tsk.assignee_name} • Deadline: {tsk.deadline}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
