import React, { useState } from 'react';
import { ClassInventoryItem, ClassSettings } from '../../../types/kas.ts';
import { sfx } from '../../../utils/soundEffects.ts';
import { ScotchTape } from '../DoodleDecorations.tsx';
import { showToast, showConfirm } from '../../UI/DoodleDialog.tsx';
import {
  Package,
  Plus,
  Search,
  Share2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Coins,
  MapPin
} from 'lucide-react';

interface InventarisTabProps {
  items?: ClassInventoryItem[];
  inventoryItems?: ClassInventoryItem[];
  settings: ClassSettings;
  canEdit: boolean;
  onSaveItem: (item: Omit<ClassInventoryItem, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteItem: (id: string) => void;
}

export const InventarisTab: React.FC<InventarisTabProps> = ({
  items,
  inventoryItems: propInventoryItems,
  settings,
  canEdit,
  onSaveItem,
  onDeleteItem
}) => {
  const inventoryItems = items || propInventoryItems || [];
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'baik' | 'rusak'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassInventoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<'baik' | 'rusak_ringan' | 'rusak_berat'>('baik');
  const [location, setLocation] = useState('');
  const [purchasedFromKas, setPurchasedFromKas] = useState<boolean>(true);
  const [price, setPrice] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleOpenAdd = () => {
    sfx.playClick();
    setEditingItem(null);
    setName('');
    setQuantity(1);
    setCondition('baik');
    setLocation('Laci Meja Kelas');
    setPurchasedFromKas(true);
    setPrice(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClassInventoryItem) => {
    sfx.playClick();
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setCondition(item.condition);
    setLocation(item.location);
    setPurchasedFromKas(item.purchasedFromKas);
    setPrice(item.price || 0);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Mohon masukkan nama barang.', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Jumlah barang minimal 1.', 'error');
      return;
    }

    sfx.playSuccess();
    onSaveItem({
      id: editingItem?.id,
      name: name.trim(),
      quantity: Number(quantity),
      condition,
      location: location.trim() || 'Ruang Kelas',
      purchasedFromKas,
      price: typeof price === 'number' && price > 0 ? price : undefined,
      notes: notes.trim()
    });

    showToast(editingItem ? 'Data barang berhasil diperbarui!' : 'Barang inventaris baru berhasil ditambahkan!', 'success');
    setIsModalOpen(false);
  };

  const handleDelete = async (item: ClassInventoryItem) => {
    const ok = await showConfirm({
      title: 'Hapus Barang Inventaris?',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" dari daftar inventaris kelas?`,
      confirmLabel: 'Ya, Hapus',
      cancelLabel: 'Batal',
      isDanger: true
    });
    if (ok) {
      sfx.playDelete();
      onDeleteItem(item.id);
      showToast('Barang berhasil dihapus dari inventaris.', 'info');
    }
  };

  // WhatsApp Recap
  const handleCopyWhatsAppRecap = () => {
    sfx.playClick();
    const rows = inventoryItems.map((item, idx) => {
      const condLabel = item.condition === 'baik' ? '✅ Baik' : item.condition === 'rusak_ringan' ? '⚠️ Rusak Ringan' : '❌ Rusak Berat';
      return `${idx + 1}. *${item.name}* (${item.quantity} unit) - ${condLabel}\n   📍 Lokasi: ${item.location} ${item.purchasedFromKas ? '• 💰 Dana Kas' : ''}`;
    }).join('\n');

    const message =
      `📦 *DAFTAR INVENTARIS BARANG KELAS*\n` +
      `*${settings.className}*\n\n` +
      `📊 *Total Barang:* ${inventoryItems.reduce((sum, i) => sum + i.quantity, 0)} unit (${inventoryItems.length} jenis)\n\n` +
      (rows || '- Belum ada data barang tercatat -') +
      `\n\n_— Dicatat via Sekretariat Kelas Gue_`;

    navigator.clipboard.writeText(message);
    showToast('Teks rekap inventaris berhasil disalin untuk WhatsApp!', 'success');
  };

  // Stats
  const totalUnits = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);
  const goodUnits = inventoryItems.filter(i => i.condition === 'baik').reduce((sum, i) => sum + i.quantity, 0);
  const brokenUnits = totalUnits - goodUnits;
  const totalKasExpense = inventoryItems.filter(i => i.purchasedFromKas).reduce((sum, i) => sum + (i.price || 0), 0);

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCondition = conditionFilter === 'all'
      ? true
      : conditionFilter === 'baik'
      ? item.condition === 'baik'
      : item.condition !== 'baik';
    return matchesSearch && matchesCondition;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="card-doodle bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative">
        <ScotchTape className="-top-3 left-6 rotate-1" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 rounded">
                Ranah Sekretaris
              </span>
              <span className="text-xs font-bold text-slate-500">
                Pencatatan Aset & Perlengkapan
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-sky-600" />
              <span>Inventaris Barang Kelas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Catat seluruh aset dan perlengkapan milik kelas (spidol, kabel terminal, P3K, sapu, peralatan presentasi), kondisinya, lokasi simpan, serta riwayat pembelian dari kas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyWhatsAppRecap}
              className="btn-doodle px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Salin Rekap WA</span>
            </button>

            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="btn-doodle px-4 py-2 bg-sky-300 hover:bg-sky-400 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#1E293B]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Barang</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Aset</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalUnits} Unit</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{inventoryItems.length} jenis barang</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Kondisi Baik</span>
          </p>
          <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{goodUnits} Unit</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Siap digunakan</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Perlu Ganti / Rusak</span>
          </p>
          <p className="text-xl font-black text-rose-600 font-mono mt-0.5">{brokenUnits} Unit</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Rusak ringan & berat</p>
        </div>

        <div className="card-doodle bg-white p-3.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-600" />
            <span>Total Belanja Kas</span>
          </p>
          <p className="text-sm sm:text-base font-black text-slate-900 font-mono mt-1 truncate">
            {formatRupiah(totalKasExpense)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Pengadaan dari kas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama barang atau lokasi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-slate-900 bg-white focus:outline-hidden focus:bg-amber-50"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sfx.playClick();
              setConditionFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              conditionFilter === 'all'
                ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({inventoryItems.length})
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setConditionFilter('baik');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              conditionFilter === 'baik'
                ? 'bg-emerald-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Kondisi Baik
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setConditionFilter('rusak');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              conditionFilter === 'rusak'
                ? 'bg-rose-300 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Rusak
          </button>
        </div>
      </div>

      {/* Inventory Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            return (
              <div
                key={item.id}
                className="card-doodle bg-white rounded-2xl border-3 border-slate-900 p-4 shadow-[4px_4px_0px_#1E293B] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          item.condition === 'baik'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : item.condition === 'rusak_ringan'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-rose-100 text-rose-900 border-rose-400'
                        }`}>
                          {item.condition === 'baik' ? 'Kondisi Baik' : item.condition === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat'}
                        </span>
                        {item.purchasedFromKas && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                            Kas Kelas
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight pt-1">
                        {item.name}
                      </h3>
                    </div>

                    <div className="px-2 py-1 bg-slate-100 rounded-lg border border-slate-900 text-center shrink-0">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Jumlah</p>
                      <p className="text-sm font-black font-mono text-slate-900">{item.quantity}x</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </p>
                    {item.price && (
                      <p className="flex items-center gap-1.5 font-mono text-emerald-700 font-bold">
                        <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Harga Beli: {formatRupiah(item.price)}</span>
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-900 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-doodle bg-white p-10 rounded-2xl border-2 border-slate-900 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-800">Tidak Ada Barang Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Belum ada barang inventaris yang dicatat. Klik tombol Tambah Barang di atas.'}
          </p>
        </div>
      )}

      {/* Modal Add / Edit Inventory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-doodle bg-white max-w-md w-full rounded-2xl p-5 border-3 border-slate-900 shadow-[4px_4px_0px_#1E293B] relative animate-in zoom-in-95 my-auto">
            <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                <span>{editingItem ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-200 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Spidol Whiteboard Snowman Hitam"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-amber-50/40 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Unit</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi Barang</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                  >
                    <option value="baik">Kondisi Baik</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Penyimpanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Lemari Belakang Kelas / Meja Dosen"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-900 font-bold bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border-2 border-slate-900 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purchasedFromKas}
                    onChange={e => setPurchasedFromKas(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-900 text-amber-500 focus:ring-0"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    Pengadaan dibeli dari Kas Kelas
                  </span>
                </label>

                {purchasedFromKas && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                      Biaya Pembelian (Estimasi / Riil)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="0"
                      value={price}
                      onChange={e => setPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 font-mono font-bold bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan barang..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-doodle px-5 py-2 rounded-xl border-2 border-slate-900 bg-sky-300 font-black text-xs shadow-[2px_2px_0px_#000]"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
