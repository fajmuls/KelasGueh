import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { RoleClaimApprovalPanel } from '../../Admin/RoleClaimApprovalPanel.tsx';
import { CURRENT_APP_VERSION } from '../../../version.ts';
import {
  Settings,
  Save,
  Download,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Tag,
  ShieldCheck,
  Send,
  Bell,
  MessageSquare,
  Bot,
  Zap,
  Globe,
  Smartphone,
  Layers,
  Plus,
  CalendarCheck,
  History,
  X,
  Database,
  RefreshCw,
  ExternalLink,
  FileJson,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { classInfo, setClassInfo, hasPermission, allUsers, switchUser, role, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: classInfo?.name || 'Teknik Informatika 2024 - Kelas A',
    code: classInfo?.code || 'TI-24A',
    semester: classInfo?.semester || 3,
    academic_year: classInfo?.academic_year || '2025/2026',
    department: classInfo?.department || 'Teknik Informatika',
    university: classInfo?.university || 'Universitas Sains & Teknologi',
    academic_advisor: classInfo?.academic_advisor || 'Dr. Ir. Hendra Wijaya, M.Kom.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // App version from version.ts
  const APP_VERSION = `v${CURRENT_APP_VERSION.version}`;
  const BUILD_DATE = `${CURRENT_APP_VERSION.releaseDate} (${CURRENT_APP_VERSION.codename})`;

  const PATCH_NOTES = [
    {
      version: `v${CURRENT_APP_VERSION.version}`,
      date: CURRENT_APP_VERSION.releaseDate,
      type: CURRENT_APP_VERSION.codename,
      notes: CURRENT_APP_VERSION.changes
    }
  ];

  const [showPatchNotes, setShowPatchNotes] = useState(false);

  // Semester Management
  const [semesters, setSemesters] = useState<any[]>([]);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026/2027');
  const [isAddingSemester, setIsAddingSemester] = useState(false);

  // Webhook and Bot Config State
  const [webhookConfig, setWebhookConfig] = useState({
    webhook_url: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    whatsapp_gateway_url: '',
    is_active: true,
    notify_announcements: true,
    notify_assignments: true,
    notify_kas_bills: true,
    notify_meetings: true,
  });
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);

  const [isRoleSwitcherActive, setIsRoleSwitcherActive] = useState<boolean>(() => {
    return localStorage.getItem('cms_show_role_switcher') === 'true';
  });

  useEffect(() => {
    loadWebhookSettings();
    loadSemesters();
  }, []);

  useEffect(() => {
    if (classInfo) {
      setFormData({
        name: classInfo.name || '',
        code: classInfo.code || '',
        semester: classInfo.semester || 1,
        academic_year: classInfo.academic_year || '',
        department: classInfo.department || '',
        university: classInfo.university || '',
        academic_advisor: classInfo.academic_advisor || '',
      });
    }
  }, [classInfo]);

  const loadSemesters = async () => {
    try {
      const res = await api.getSemesters();
      if (Array.isArray(res)) {
        // Res is already an array
        const normalized = res.map((item: any, idx: number) => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id || `sem_${idx + 1}`,
              name: item.name || String(item),
              academic_year: item.academic_year || classInfo?.academic_year || '2026/2027',
              is_active: Boolean(item.is_active),
            };
          }
          return {
            id: `sem_${idx + 1}`,
            name: String(item),
            academic_year: classInfo?.academic_year || '2026/2027',
            is_active: String(item) === String(classInfo?.semester),
          };
        });
        setSemesters(normalized);
      } else if (res && typeof res === 'object' && Array.isArray((res as any).semesters)) {
        // Res is { semesters: [...], current_semester: ..., academic_year: ... }
        const rawList = (res as any).semesters;
        const currentSem = (res as any).current_semester || classInfo?.semester || '';
        const acYear = (res as any).academic_year || classInfo?.academic_year || '2026/2027';
        const normalized = rawList.map((item: any, idx: number) => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id || `sem_${idx + 1}`,
              name: item.name || String(item),
              academic_year: item.academic_year || acYear,
              is_active: Boolean(item.is_active) || item.name === currentSem,
            };
          }
          return {
            id: `sem_${idx + 1}`,
            name: String(item),
            academic_year: acYear,
            is_active: String(item) === String(currentSem),
          };
        });
        setSemesters(normalized);
      } else {
        setSemesters([]);
      }
    } catch (err) {
      console.error('Error loading semesters:', err);
      setSemesters([]);
    }
  };

  const handleSetActiveSemester = async (id: string) => {
    try {
      await api.setActiveSemester(id);
      await loadSemesters();
      const me = await api.getMe();
      if (me.classInfo) setClassInfo(me.classInfo);
      alert('Semester aktif berhasil diubah!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah semester aktif');
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName.trim()) return;
    try {
      setIsAddingSemester(true);
      await api.addSemester({
        name: newSemesterName.trim(),
        academic_year: newAcademicYear.trim(),
      });
      setNewSemesterName('');
      await loadSemesters();
      alert('Semester baru berhasil ditambahkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan semester');
    } finally {
      setIsAddingSemester(false);
    }
  };

  const loadWebhookSettings = async () => {
    try {
      const res = await api.getWebhookConfig();
      const cfg: any = res?.config;
      if (cfg) {
        setWebhookConfig({
          webhook_url: cfg.whatsapp_webhook_url || cfg.webhook_url || '',
          telegram_bot_token: cfg.telegram_bot_token || '',
          telegram_chat_id: cfg.telegram_chat_id || '',
          whatsapp_gateway_url: cfg.whatsapp_gateway_url || cfg.whatsapp_webhook_url || '',
          is_active: cfg.is_enabled ?? cfg.is_active ?? true,
          notify_announcements: cfg.events?.announcements ?? cfg.notify_announcements ?? true,
          notify_assignments: cfg.events?.assignment_deadline_h1 ?? cfg.notify_assignments ?? true,
          notify_kas_bills: cfg.events?.kas_bill ?? cfg.notify_kas_bills ?? true,
          notify_meetings: cfg.events?.meetings ?? cfg.notify_meetings ?? true,
        });
      }
    } catch (err) {
      console.error('Error loading webhook config:', err);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingWebhook(true);
      const payload: any = {
        whatsapp_webhook_url: webhookConfig.webhook_url || webhookConfig.whatsapp_gateway_url,
        telegram_bot_token: webhookConfig.telegram_bot_token,
        telegram_chat_id: webhookConfig.telegram_chat_id,
        is_enabled: webhookConfig.is_active,
        events: {
          announcements: webhookConfig.notify_announcements,
          assignment_deadline_h1: webhookConfig.notify_assignments,
          kas_bill: webhookConfig.notify_kas_bills,
          meetings: webhookConfig.notify_meetings,
        },
      };
      const res = await api.updateWebhookConfig(payload);
      const updated: any = res?.config;
      if (updated) {
        setWebhookConfig({
          webhook_url: updated.whatsapp_webhook_url || updated.webhook_url || webhookConfig.webhook_url,
          telegram_bot_token: updated.telegram_bot_token || webhookConfig.telegram_bot_token,
          telegram_chat_id: updated.telegram_chat_id || webhookConfig.telegram_chat_id,
          whatsapp_gateway_url: updated.whatsapp_webhook_url || webhookConfig.whatsapp_gateway_url,
          is_active: updated.is_enabled ?? webhookConfig.is_active,
          notify_announcements: updated.events?.announcements ?? webhookConfig.notify_announcements,
          notify_assignments: updated.events?.assignment_deadline_h1 ?? webhookConfig.notify_assignments,
          notify_kas_bills: updated.events?.kas_bill ?? webhookConfig.notify_kas_bills,
          notify_meetings: updated.events?.meetings ?? webhookConfig.notify_meetings,
        });
      }
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi webhook');
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      const res = await api.testWebhook(
        '🔔 [TES SISTEM CMS] Integrasi Bot WhatsApp & Telegram Kelas berhasil terhubung! Notifikasi deadline dan kas siap disalurkan.'
      );
      alert('✓ Sinyal notifikasi webhook & bot berhasil dikirim! Silakan periksa log saluran komunikasi kelas.');
    } catch (err: any) {
      alert(err.message || 'Gagal menguji webhook');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleToggleRoleSwitcher = () => {
    const nextState = !isRoleSwitcherActive;
    setIsRoleSwitcherActive(nextState);
    localStorage.setItem('cms_show_role_switcher', String(nextState));
    window.dispatchEvent(new CustomEvent('cms-toggle-role-switcher', { detail: { show: nextState } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateClassInfo(formData);
      setClassInfo(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDatabase = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(classInfo, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `Backup_ClassManagement_${classInfo?.code}_${new Date().toISOString().slice(0, 10)}.json`
    );
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Pengaturan Kelas, Bot & Versi Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi metadata kelas perkuliahan, integrasi bot notifikasi WhatsApp/Telegram, panel admin, serta pembaruan versi aplikasi.
        </p>
      </div>

      {/* App Version Card (Required by custom instruction) */}
      <div className="p-6 bg-[#0F172A] rounded-2xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Versi Terpasang
            </span>
            <span className="text-lg font-mono font-bold text-indigo-300">{APP_VERSION}</span>
            <button 
              onClick={() => setShowPatchNotes(true)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Lihat Patch Notes
            </button>
            <span className="text-xs text-slate-400">({BUILD_DATE})</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              Database: Supabase
            </span>
          </div>
          <h3 className="text-base font-bold text-white">Class Management System (CMS Pro 01SAKP014)</h3>
          <p className="text-xs text-slate-300">
            Dukungan PWA Offline, 8 Silabus Perkuliahan & Kontak Dosen, Otomatisasi Webhook/Bot, Payment Gateway VA/QRIS, dan Ekspor Kalender iCal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Sistem Up-to-Date
          </span>
        </div>
      </div>


      {/* Webhook WhatsApp / Telegram Integration Panel */}
      <form
        onSubmit={handleSaveWebhook}
        className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Integrasi Webhook & Bot Notifikasi (WhatsApp / Telegram)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirimkan pemberitahuan otomatis ke grup kelas saat ada pengumuman, pengingat deadline H-1 tugas, dan tagihan kas baru.
            </p>
          </div>

          {webhookSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Konfigurasi Bot Tersimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              WhatsApp Gateway / Webhook URL (Fonnte / Wablas / Discord / Custom)
            </label>
            <input
              type="text"
              placeholder="https://api.fonnte.com/send atau webhook URL"
              value={webhookConfig.webhook_url || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, webhook_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Telegram Bot Token (dari @BotFather)
            </label>
            <input
              type="password"
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={webhookConfig.telegram_bot_token || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, telegram_bot_token: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Telegram Chat ID Grup / Channel Kelas
            </label>
            <input
              type="text"
              placeholder="-1001234567890 atau @GrupKelas01SAKP014"
              value={webhookConfig.telegram_chat_id || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, telegram_chat_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status Bot Notifikasi
            </label>
            <div className="flex items-center gap-2 h-10">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookConfig.is_active}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {webhookConfig.is_active ? 'Bot Aktif' : 'Bot Dinonaktifkan'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Triggers checkboxes */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">Pemicu Otomatisasi (Triggers):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_announcements}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_announcements: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Pengumuman Baru Diterbitkan</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_assignments}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_assignments: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Tugas Kuliah & Pengingat Deadline H-1</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_kas_bills}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_kas_bills: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Penerbitan Tagihan Kas & Bukti Kas Baru</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_meetings}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_meetings: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Jadwal Rapat Kelas & Notulen</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTestingWebhook ? 'Mengirim Sinyal...' : 'Kirim Uji Coba Webhook'}</span>
          </button>

          <button
            type="submit"
            disabled={isSavingWebhook}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingWebhook ? 'Menyimpan...' : 'Simpan Konfigurasi Bot'}</span>
          </button>
        </div>
      </form>

      {/* Form Settings Identitas Kelas */}
      <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Identitas & Profil Kelas Perkuliahan</h3>
            <p className="text-xs text-slate-500">Informasi ini tampil pada seluruh modul dan kop dokumen resmi</p>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Perubahan berhasil disimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Kelas</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Kelas / Singkatan</label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester Berjalan</label>
            <input
              type="number"
              min={1}
              max={14}
              value={formData.semester ?? 1}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Akademik</label>
            <input
              type="text"
              value={formData.academic_year || ''}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program Studi</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Perguruan Tinggi / Universitas</label>
            <input
              type="text"
              value={formData.university || ''}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Dosen Wali / Pembimbing Akademik (DPA)</label>
            <input
              type="text"
              value={formData.academic_advisor || ''}
              onChange={(e) => setFormData({ ...formData, academic_advisor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportDatabase}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Metadata Backup (JSON)
          </button>

          {hasPermission('manage_system_settings') ? (
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              *Hanya Ketua Kelas & Super Admin yang berhak merubah identitas kelas.
            </span>
          )}
        </div>
      </form>

      {/* Super Admin Google Account Role Approval Panel */}
      {(isSuperAdmin || hasPermission('assign_role')) && (
        <RoleClaimApprovalPanel />
      )}

      {/* Semester & Academic Year Management */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Kelola Semester & Tahun Akademik
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur semester yang sedang aktif berjalan dan tambahkan semester baru untuk jadwal perkuliahan.
            </p>
          </div>
        </div>

        {/* Semesters list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.isArray(semesters) && semesters.length > 0 ? (
            semesters.map((sem) => (
              <div
                key={sem.id || sem.name}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  sem.is_active
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{sem.name}</span>
                    {sem.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        Aktif Sekarang
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Tahun: {sem.academic_year}</p>
                </div>

                {!sem.is_active && (
                  <button
                    type="button"
                    onClick={() => handleSetActiveSemester(sem.id || sem.name)}
                    className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Jadikan Semester Aktif
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Belum ada data semester atau sedang dimuat...
            </div>
          )}
        </div>

        {/* Add semester form */}
        {hasPermission('manage_system_settings') && (
          <form
            onSubmit={handleAddSemester}
            className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Semester Baru
              </label>
              <input
                type="text"
                placeholder="Contoh: Semester 2 (Genap)"
                value={newSemesterName || ''}
                onChange={(e) => setNewSemesterName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Akademik
              </label>
              <input
                type="text"
                placeholder="Contoh: 2026/2027"
                value={newAcademicYear || ''}
                onChange={(e) => setNewAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingSemester}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingSemester ? 'Menambahkan...' : 'Tambah Semester'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Admin Panel: Mode Uji Peran & Developer Tools */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Panel Kontrol Admin & Mode Uji Peran</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bilah pengujian peran disembunyikan secara default di tampilan awal siswa. Anda dapat mengaktifkannya di sini untuk pengujian hak akses RBAC.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleRoleSwitcher}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isRoleSwitcherActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{isRoleSwitcherActive ? '✓ Bilah Uji Peran: Aktif' : 'Tampilkan Bilah Uji Peran'}</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Beralih Persona Langsung (Quick Switch Admin):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { roleKey: 'role_superadmin', label: 'Super Admin', name: 'Dr. Hendra' },
              { roleKey: 'role_ketua', label: 'Ketua Kelas', name: 'Aditya Pratama' },
              { roleKey: 'role_bendahara', label: 'Bendahara', name: 'Siti Rahmawati' },
              { roleKey: 'role_anggota', label: 'Siswa', name: 'Rian Hidayat' },
            ].map((persona) => {
              const targetUser = allUsers.find(u => u.role_id === persona.roleKey);
              const isActive = role?.id === persona.roleKey;
              return (
                <button
                  key={persona.roleKey}
                  type="button"
                  onClick={() => targetUser && switchUser(targetUser.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] text-slate-400 font-normal">{persona.label}</p>
                  <p className="font-semibold text-slate-900 truncate">{persona.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* Saran Update & Pembaruan Sistem (User Instruction) */}
      <div className="p-6 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Saran Pengembangan & Rekomendasi Pembaruan Aplikasi Berikutnya
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Berikut adalah rekomendasi peningkatan fungsional dan teknis yang telah dianalisis untuk mendukung kelancaran operasional kelas perkuliahan:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> AI Auto-Summary Notulen Rapat & Tugas (Gemini)
            </h4>
            <p className="text-[11px] text-slate-600">
              Menghasilkan ringkasan notulen rapat secara otomatis dan mengkonversi hasil diskusi menjadi to-do list tugas kelas siap bagi.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Presensi Kelas QR Code Dinamis & Geofencing
            </h4>
            <p className="text-[11px] text-slate-600">
              Membuat kode QR presensi yang berganti setiap 10 detik dengan validasi radius lokasi GPS ruangan kuliah kampus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Direct Sync Google Drive & Multi-File Upload
            </h4>
            <p className="text-[11px] text-slate-600">
              Integrasi Google Picker API untuk memilih file makalah/tugas langsung dari cloud drive tanpa harus copy-paste tautan manual.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Notifikasi WhatsApp Otomatis H-1 Deadline
            </h4>
            <p className="text-[11px] text-slate-600">
              Pengiriman pengingat berkala ke grup WhatsApp kelas pada H-1 jam 19:00 WIB untuk setiap tugas yang belum diserahkan.
            </p>
          </div>
        </div>
      </div>
      {/* Patch Notes Modal */}
      {showPatchNotes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catatan Rilis (Patch Notes)</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Riwayat Pembaruan Sistem</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {PATCH_NOTES.map((patch) => (
                <div key={patch.version} className="relative pl-6 border-l-2 border-slate-100 space-y-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{patch.version}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">{patch.type}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{patch.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {patch.notes.map((note, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
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

