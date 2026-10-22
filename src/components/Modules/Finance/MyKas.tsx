import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { Payment } from '../../../types/index.ts';
import {
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Receipt,
  QrCode,
  Zap,
  Building2,
} from 'lucide-react';
import { Badge } from '../../UI/Badge.tsx';
import { PaymentGatewayModal } from './PaymentGatewayModal.tsx';

export const MyKasModule: React.FC = () => {
  const { user, classInfo } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentForGateway, setSelectedPaymentForGateway] = useState<Payment | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const list = await api.getPayments({ user_id: user?.id });
      setPayments(list);
    } catch (err) {
      console.error('Error loading my payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.id]);

  const copyRekening = () => {
    navigator.clipboard.writeText('880192837482');
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" /> Kas Saya & Riwayat Iuran
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pantau status tagihan kas Anda, bayar instan via Virtual Account / QRIS otomatis, atau konfirmasi bukti transfer manual.
        </p>
      </div>

      {/* Rekening Tujuan Kas Kelas */}
      <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
            Rekening & Virtual Account Resmi Kas {classInfo?.code}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-mono font-bold">8801-9283-7482</span>
            <button
              onClick={copyRekening}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyFeedback ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
          <p className="text-xs text-blue-100">
            Bank Mandiri • a.n. Kas Mahasiswa {classInfo?.code} (Bendahara: Siti Aisyah)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20">
          <QrCode className="w-8 h-8 text-white" />
          <div className="text-left">
            <p className="text-xs font-bold">Payment Gateway Aktif</p>
            <p className="text-[10px] text-blue-200">Support VA BCA, Mandiri, BRI, BNI & QRIS</p>
          </div>
        </div>
      </div>

      {/* List of Payments for this user */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Daftar Tagihan & Iuran Kas Anda</h3>
          <span className="text-xs text-slate-500">Total {payments.length} Tagihan</span>
        </div>

        <div className="divide-y divide-slate-100">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada data tagihan yang diterbitkan untuk akun Anda.
            </div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{p.bill_title}</h4>
                    <Badge
                      variant={
                        p.status === 'paid'
                          ? 'success'
                          : p.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {p.status === 'paid'
                        ? 'Lunas'
                        : p.status === 'pending'
                        ? 'Menunggu Verifikasi Bendahara'
                        : 'Belum Lunas'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Nominal: <strong className="text-slate-800">Rp {p.amount.toLocaleString('id-ID')}</strong>
                    {p.paid_at && ` • Dibayar pada: ${new Date(p.paid_at).toLocaleDateString('id-ID')}`}
                    {p.payment_method && ` • Metode: ${p.payment_method}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Terverifikasi Lunas
                    </span>
                  ) : p.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      <Clock className="w-4 h-4" /> Menunggu Validasi
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedPaymentForGateway(p)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Bayar Kas (VA / QRIS / Transfer)</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={!!selectedPaymentForGateway}
        onClose={() => setSelectedPaymentForGateway(null)}
        payment={selectedPaymentForGateway}
        onPaymentSuccess={loadPayments}
      />
    </div>
  );
};

