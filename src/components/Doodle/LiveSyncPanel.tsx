import React, { useState, useEffect } from 'react';
import { SyncTelemetry, ClassDefinition } from '../../types/kas.ts';
import {
  subscribeSyncTelemetry,
  getSyncTelemetry,
  LocalKasRepository
} from '../../services/supabaseClient.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { showToast } from '../UI/DoodleDialog.tsx';
import { RefreshCw, UploadCloud, Cloud, CloudOff, Database, CheckCircle2, Clock } from 'lucide-react';

interface LiveSyncPanelProps {
  activeClass: ClassDefinition;
  canPublish?: boolean;
  onSyncComplete?: () => void;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const SOURCE_LABELS: Record<SyncTelemetry['lastSource'], string> = {
  cache: 'Cache Lokal (0 KB Kuota)',
  snapshot: 'Snapshot JSON Cloud',
  sql: 'Migrasi Awal Tabel SQL',
  upload: 'Unggah Snapshot Cloud',
  local: 'Penyimpanan Lokal'
};

export const LiveSyncPanel: React.FC<LiveSyncPanelProps> = ({
  activeClass,
  canPublish = false,
  onSyncComplete
}) => {
  const [telemetry, setTelemetry] = useState<SyncTelemetry>(() => getSyncTelemetry());
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncTelemetry(setTelemetry);
    return unsub;
  }, []);

  const handleFastPull = async () => {
    sfx.playClick();
    setIsSyncingNow(true);
    try {
      const res = await LocalKasRepository.syncClassFast(activeClass.id, { forceDownload: true });
      if (res.updated) {
        sfx.playCoinChime();
        showToast(
          `Snapshot kelas ${activeClass.code} diperbarui (${formatBytes(res.snapshotBytes)})!`,
          'success'
        );
      } else {
        showToast(`Data kelas ${activeClass.code} sudah paling mutakhir.`, 'info');
      }
      onSyncComplete?.();
    } catch {
      showToast('Gagal melakukan sinkronisasi snapshot.', 'error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleForceUpload = async () => {
    sfx.playClick();
    setIsSyncingNow(true);
    try {
      const res = await LocalKasRepository.forceSyncAllToCloud('Live Sync Panel');
      showToast(res.message, res.success ? 'success' : 'error');
      onSyncComplete?.();
    } finally {
      setIsSyncingNow(false);
    }
  };

  const formattedTime = telemetry.lastSyncedAt
    ? new Date(telemetry.lastSyncedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '-';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
          telemetry.status === 'synced'
            ? 'text-emerald-900 bg-emerald-100 border-emerald-400 hover:bg-emerald-200'
            : telemetry.status === 'syncing'
            ? 'text-amber-900 bg-amber-100 border-amber-400'
            : 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200'
        }`}
        title="Buka Panel Live Sync & Snapshot Kuota"
      >
        {telemetry.status === 'synced' && <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />}
        {telemetry.status === 'syncing' && <RefreshCw className="w-3 h-3 text-amber-700 animate-spin shrink-0" />}
        {telemetry.status === 'offline' && <CloudOff className="w-3 h-3 text-slate-500 shrink-0" />}
        <span className="tabular-nums">
          {telemetry.status === 'syncing'
            ? 'Sync...'
            : telemetry.snapshotBytes > 0
            ? `Sync · ${formatBytes(telemetry.snapshotBytes)}`
            : telemetry.status === 'synced'
            ? 'Sinkron'
            : 'Lokal'}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 card-doodle bg-white rounded-xl p-3.5 z-[110] border-2 border-slate-900 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-200 border border-slate-900 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-emerald-900" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">Panel Live Sync</p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Kelas: <span className="font-mono text-slate-800">{activeClass.code}</span>
                  </p>
                </div>
              </div>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-900 ${
                  telemetry.status === 'synced'
                    ? 'bg-emerald-300 text-slate-950'
                    : telemetry.status === 'syncing'
                    ? 'bg-amber-300 text-slate-950'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {telemetry.status === 'synced' ? 'Terhubung' : telemetry.status === 'syncing' ? 'Proses' : 'Lokal'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-600" />
                  <span>Ukuran Snapshot</span>
                </p>
                <p className="font-mono font-black text-slate-900 tabular-nums mt-0.5">
                  {formatBytes(telemetry.snapshotBytes)}
                </p>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg">
                <p className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" />
                  <span>Terakhir Sync</span>
                </p>
                <p className="font-mono font-black text-slate-900 tabular-nums mt-0.5">
                  {formattedTime}
                </p>
              </div>
            </div>

            <div className="p-2 bg-amber-50/70 border border-slate-300 rounded-lg text-[10px] text-slate-700 space-y-0.5">
              <p className="font-bold text-slate-900">
                Sumber Data: <span className="text-emerald-800">{SOURCE_LABELS[telemetry.lastSource]}</span>
              </p>
              <p className="text-slate-600 leading-snug">
                Mode hemat kuota aktif: hanya mengunduh 1 file snapshot JSON saat versi kelas berubah.
              </p>
            </div>

            {telemetry.errorMessage && (
              <p className="text-[10px] text-rose-700 font-bold bg-rose-50 p-2 rounded border border-rose-300">
                {telemetry.errorMessage}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSyncingNow}
                onClick={handleFastPull}
                className="flex-1 btn-doodle px-3 py-2 min-h-[38px] bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                <span>Sinkron Cepat</span>
              </button>

              {canPublish && (
                <button
                  type="button"
                  disabled={isSyncingNow}
                  onClick={handleForceUpload}
                  className="btn-doodle px-3 py-2 min-h-[38px] bg-emerald-300 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Unggah Snapshot Kelas Terbaru ke Cloud"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Simpan Cloud</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
