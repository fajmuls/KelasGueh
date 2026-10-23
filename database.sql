-- KELAS GUE v3.2.0 DATABASE SCHEMA
-- Target: Supabase (PostgreSQL)
-- Cara Pakai: Salin seluruh kode ini dan tempel di 'SQL Editor' dashboard Supabase Anda, lalu klik 'Run'.

-- 1. Tabel Konfigurasi Kelas (Single Row)
CREATE TABLE IF NOT EXISTS public.class_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    class_name TEXT NOT NULL DEFAULT 'Kelas Baru',
    weekly_dues_amount NUMERIC NOT NULL DEFAULT 5000,
    kas_target_amount NUMERIC NOT NULL DEFAULT 1000000,
    currency_prefix TEXT NOT NULL DEFAULT 'Rp',
    academic_year TEXT NOT NULL DEFAULT '2023/2024',
    pin_hash TEXT, -- PIN terenkripsi bcrypt untuk transaksi besar
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 2. Tabel Anggota Kelas
CREATE TABLE IF NOT EXISTS public.kas_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    weekly_status JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"2026_10_W1": true}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Transaksi Kas
CREATE TABLE IF NOT EXISTS public.kas_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by TEXT NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Audit Log (Riwayat Aktivitas)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    user_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Izin Role User (Whitelist Super Admin/Bendahara)
CREATE TABLE IF NOT EXISTS public.user_roles (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'bendahara', 'anggota')),
    assigned_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SECURITY: Enable Row Level Security (RLS)
ALTER TABLE public.class_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- POLICIES: Izinkan publik membaca data (Transparansi)
CREATE POLICY "Public Read Access" ON public.class_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.kas_members FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.kas_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.audit_logs FOR SELECT USING (true);

-- POLICIES: Hanya Admin/Bendahara yang bisa ubah data (Simulasi via Authenticated)
-- Catatan: Untuk produksi lebih ketat, gunakan role check via user_roles table
CREATE POLICY "Editor Full Access" ON public.kas_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editor Full Access" ON public.kas_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editor Full Access" ON public.class_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "System Insert Audit" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- REALTIME: Aktifkan Sinkronisasi Instan
ALTER PUBLICATION supabase_realtime ADD TABLE kas_members;
ALTER PUBLICATION supabase_realtime ADD TABLE kas_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE class_settings;

-- SEED: Data Awal
INSERT INTO public.class_settings (id, class_name) VALUES (1, 'Kelas Gue v3') ON CONFLICT DO NOTHING;
