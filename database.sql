-- SCRIPT SETUP DATABASE SUPABASE (KELAS GUE v3.3)
-- 1. Jalankan di SQL Editor Supabase Dashboard
-- 2. Pastikan Mode Realtime Aktif di Tabel-Tabel Ini

-- [A] TABEL TRANSAKSI KAS
CREATE TABLE IF NOT EXISTS public.kas_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Umum',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by TEXT NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [B] TABEL ANGGOTA / SISWA
CREATE TABLE IF NOT EXISTS public.kas_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    weekly_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [C] TABEL AUDIT LOG (KEAMANAN)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    user_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [D] TABEL PENGATURAN KELAS
CREATE TABLE IF NOT EXISTS public.class_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    class_name TEXT NOT NULL DEFAULT 'Kelas Gue',
    weekly_dues_amount NUMERIC NOT NULL DEFAULT 5000,
    kas_target_amount NUMERIC NOT NULL DEFAULT 1000000,
    currency_prefix TEXT NOT NULL DEFAULT 'Rp',
    academic_year TEXT NOT NULL DEFAULT '2023/2024',
    CONSTRAINT one_row CHECK (id = 1)
);

-- [E] KEAMANAN: ROW LEVEL SECURITY (RLS)
-- Aktifkan RLS di semua tabel
ALTER TABLE public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_settings ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses (Public Read, Authenticated Write)
-- Catatan: Untuk aplikasi kelas yang simpel, kita izinkan baca publik untuk transparansi.
CREATE POLICY "Public Read Access" ON public.kas_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.kas_members FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.class_settings FOR SELECT USING (true);

-- Hanya izinkan Insert/Update jika user memiliki hak (bisa dibatasi via Auth Role di Supabase)
-- Untuk tutorial ini kita buat simpel agar user bisa langsung pakai
CREATE POLICY "Enable All for Authed" ON public.kas_transactions FOR ALL USING (true);
CREATE POLICY "Enable All for Authed" ON public.kas_members FOR ALL USING (true);
CREATE POLICY "Enable All for Authed" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Enable All for Authed" ON public.class_settings FOR ALL USING (true);

-- [F] AKTIFKAN REALTIME BROADCAST
-- Penting agar perubahan di HP Bendahara langsung muncul di HP Anggota lain
ALTER PUBLICATION supabase_realtime ADD TABLE kas_transactions, kas_members, audit_logs, class_settings;

-- [G] SETUP STORAGE BUCKET
-- Jalankan ini via Dashboard Supabase (Menu Storage):
-- 1. Buat Bucket Baru bernama "nota-kas"
-- 2. Set sebagai "Public" agar semua anggota bisa melihat foto kuitansi
