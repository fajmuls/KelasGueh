import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { EventItem } from '../../../types/index.ts';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Filter,
  Trash2,
  List,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const AgendaModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add event form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'lecture',
    date: '2026-09-12',
    start_time: '08:00',
    end_time: '10:00',
    location: 'Lab Komputasi A',
    pic_name: 'Ketua Kelas',
  });

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const list = await api.getEvents();
      setEvents(list);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => filterType === 'all' || e.type === filterType);
  }, [events, filterType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvent(formData as any);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'lecture',
        date: '2026-09-12',
        start_time: '08:00',
        end_time: '10:00',
        location: '',
        pic_name: '',
      });
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan agenda');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus agenda ini?')) {
      try {
        await api.deleteEvent(id);
        await loadEvents();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus agenda');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" /> Agenda & Kalender Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jadwal perkuliahan, praktikum laboratorium, ujian, rapat pengurus, dan kegiatan kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Daftar
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Kalender
            </button>
          </div>

          {hasPermission('create_agenda') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Agenda
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Bar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Kategori:
        </span>
        {[
          { id: 'all', label: 'Semua' },
          { id: 'lecture', label: 'Perkuliahan' },
          { id: 'exam', label: 'Ujian / UTS' },
          { id: 'meeting', label: 'Rapat' },
          { id: 'event', label: 'Kegiatan Kelas' },
          { id: 'deadline', label: 'Deadline Tugas' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterType(c.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filterType === c.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Tidak ada agenda untuk kategori yang dipilih.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">
                    {new Date(evt.date).toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-slate-900 leading-none">
                    {new Date(evt.date).getDate()}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(evt.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                    <Badge
                      variant={
                        evt.type === 'exam'
                          ? 'danger'
                          : evt.type === 'lecture'
                          ? 'primary'
                          : evt.type === 'meeting'
                          ? 'purple'
                          : 'neutral'
                      }
                    >
                      {evt.type}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600">{evt.description}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {evt.start_time} - {evt.end_time} WIB
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {evt.location}
                    </span>
                    {evt.pic_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        PIC: {evt.pic_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasPermission('delete_agenda') && (
                <button
                  onClick={() => handleDelete(evt.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors self-end sm:self-center"
                  title="Hapus Agenda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add Agenda */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Agenda Baru"
        subtitle="Jadwalkan kegiatan perkuliahan atau acara kelas"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Agenda</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kuliah Pengganti Pemrograman Web"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="lecture">Perkuliahan</option>
                <option value="exam">Ujian / Evaluasi</option>
                <option value="meeting">Rapat</option>
                <option value="event">Kegiatan Kelas</option>
                <option value="deadline">Deadline Tugas</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Waktu Mulai</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Waktu Selesai</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ruangan / Lokasi</label>
              <input
                type="text"
                placeholder="Contoh: Gedung E Lt. 3 / Zoom"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
              <input
                type="text"
                placeholder="Contoh: Sie Akademik"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tambahan</label>
            <textarea
              rows={3}
              placeholder="Materi yang dibahas atau instruksi khusus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold"
            >
              Simpan Agenda
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
