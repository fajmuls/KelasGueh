-- SCRIPT SETUP DATABASE SUPABASE (KELAS GUE v3.9.0)
-- 1. Jalankan di SQL Editor Supabase Dashboard (Klik "New Query")
-- 2. Pastikan Mode Realtime Aktif di Tabel-Tabel Ini via Dashboard

-- [A] TABEL PENGATURAN KELAS (PENTING: Harus ada 1 row default)
CREATE TABLE IF NOT EXISTS public.class_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    class_name TEXT NOT NULL DEFAULT 'Kelas Gue',
    weekly_dues_amount NUMERIC NOT NULL DEFAULT 5000,
    kas_target_amount NUMERIC NOT NULL DEFAULT 2500000,
    currency_prefix TEXT NOT NULL DEFAULT 'Rp',
    academic_year TEXT NOT NULL DEFAULT 'Semester Ganjil 2026/2027',
    site_url TEXT,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    CONSTRAINT one_row CHECK (id = 1)
);

-- Migrasi: Jika kolom lama 'target_amount' masih ada, kita rename (opsional jika clean setup)
-- ALTER TABLE public.class_settings RENAME COLUMN target_amount TO kas_target_amount;

-- Masukkan data awal jika belum ada
INSERT INTO public.class_settings (id, class_name) 
VALUES (1, 'Kelas Gue')
ON CONFLICT (id) DO NOTHING;

-- [B] TABEL ANGGOTA / SISWA
CREATE TABLE IF NOT EXISTS public.kas_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    weekly_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [C] TABEL TRANSAKSI KAS (BUKU KAS)
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

-- [D] TABEL AUDIT LOG (LOG AKTIVITAS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    user_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [E] TABEL USER PROFILES (UNTUK LOGIN GOOGLE & ROLE)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    nim TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- [F] TABEL ROLE CLAIMS (PENDING APPROVAL)
CREATE TABLE IF NOT EXISTS public.role_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    requested_role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users,
    reviewed_at TIMESTAMPTZ
);

-- [G] KEAMANAN: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.class_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_claims ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Publik BISA BACA (untuk transparansi)
CREATE POLICY "Public Read" ON public.class_settings FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.kas_members FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.kas_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.user_profiles FOR SELECT USING (true);

-- Kebijakan Akses: Hanya Authed BISA TULIS (Disederhanakan untuk kemudahan)
CREATE POLICY "Authed Write" ON public.class_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authed Write" ON public.kas_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authed Write" ON public.kas_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authed Write" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authed Write" ON public.user_profiles FOR ALL USING (auth.uid() = id OR auth.role() = 'authenticated');
CREATE POLICY "Authed Write" ON public.role_claims FOR ALL USING (auth.role() = 'authenticated');

-- [H] AKTIFKAN REALTIME
-- Jalankan ini di dashboard Supabase -> Database -> Replication -> "supabase_realtime" publication
-- Klik "Add Tables" dan pilih: class_settings, kas_members, kas_transactions, audit_logs, role_claims
