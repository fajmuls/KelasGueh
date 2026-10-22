import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { DocumentItem } from '../../../types/index.ts';
import {
  FileText,
  Plus,
  Download,
  Filter,
  Trash2,
  Lock,
  Globe,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { Modal } from '../../UI/Modal.tsx';

export const DocumentsModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Materi Kuliah',
    file_type: 'PDF',
    file_size: '2.5 MB',
    permission_level: 'public',
  });

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const list = await api.getDocuments();
      setDocuments(list);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => categoryFilter === 'all' || d.category === categoryFilter);
  }, [documents, categoryFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDocument({
        ...formData,
        file_url: 'https://example.com/doc.pdf',
        version: 'v1.0',
      } as any);
      setIsUploadModalOpen(false);
      setFormData({
        name: '',
        category: 'Materi Kuliah',
        file_type: 'PDF',
        file_size: '1.8 MB',
        permission_level: 'public',
      });
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah berkas');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus dokumen ini dari arsip kelas?')) {
      try {
        await api.deleteDocument(id);
        await loadDocuments();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus dokumen');
      }
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    alert(`Mengunduh file arsip "${doc.name}" (${doc.file_size}). File tersimpan ke perangkat.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Repositori Dokumen & Materi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Arsip terpusat materi kuliah, silabus, proposal, notulensi rapat, surat keputusan, dan LPJ kas.
          </p>
        </div>

        {hasPermission('create_documents') && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Upload Dokumen
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Kategori:
        </span>
        {[
          { id: 'all', label: 'Semua Kategori' },
          { id: 'Materi Kuliah', label: 'Materi Kuliah' },
          { id: 'Administrasi', label: 'Administrasi & Jadwal' },
          { id: 'Notulen', label: 'Notulensi' },
          { id: 'Proposal', label: 'Proposal Kegiatan' },
          { id: 'LPJ', label: 'Laporan LPJ' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              categoryFilter === c.id
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((d) => (
          <div
            key={d.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-emerald-200 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={d.permission_level === 'public' ? 'success' : 'purple'}>
                  {d.permission_level === 'public' ? (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Publik
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Pengurus
                    </span>
                  )}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {d.file_type} • {d.version}
                </span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{d.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{d.category}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Ukuran: {d.file_size}</span>
                <span>Oleh: {d.uploaded_by_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(d)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Unduh Berkas
                </button>

                {hasPermission('delete_documents') && (
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Upload Document */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah Dokumen Kelas"
        subtitle="Simpan arsip materi atau berkas administrasi"
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul / Nama Dokumen</label>
            <input
              type="text"
              required
              placeholder="Contoh: Modul Praktikum Algoritma & Struktur Data"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="Materi Kuliah">Materi Kuliah</option>
                <option value="Administrasi">Administrasi & Jadwal</option>
                <option value="Notulen">Notulensi Rapat</option>
                <option value="Proposal">Proposal</option>
                <option value="LPJ">Laporan LPJ</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Format Berkas</label>
              <select
                value={formData.file_type}
                onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
              >
                <option value="PDF">PDF Document</option>
                <option value="DOCX">Microsoft Word (DOCX)</option>
                <option value="PPTX">PowerPoint (PPTX)</option>
                <option value="XLSX">Spreadsheet (XLSX)</option>
                <option value="ZIP">Archive ZIP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hak Akses Berkas</label>
            <select
              value={formData.permission_level}
              onChange={(e) => setFormData({ ...formData, permission_level: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            >
              <option value="public">Seluruh Anggota Kelas (Publik)</option>
              <option value="management_only">Hanya Pengurus Inti</option>
            </select>
          </div>

          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Simulasi File Attachment</p>
            <p className="text-[11px] text-slate-400">
              Ukuran berkas otomatis diestimasi 2.4 MB saat disimpan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
            >
              Simpan Dokumen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
