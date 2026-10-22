import React, { useState, useEffect } from 'react';
import { Payment } from '../../../types/index.ts';
import { api } from '../../../services/api.ts';
import {
  CreditCard,
  QrCode,
  Building2,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Modal } from '../../UI/Modal.tsx';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentSuccess: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  payment,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<'va' | 'qris' | 'manual'>('va');
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca');
  const [vaData, setVaData] = useState<any>(null);
  const [qrisData, setQrisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    if (isOpen && payment) {
      if (method === 'va') {
        fetchVA(selectedBank);
      } else if (method === 'qris') {
        fetchQRIS();
      }
    }
  }, [isOpen, payment, method, selectedBank]);

  const fetchVA = async (bank: string) => {
    if (!payment) return;
    try {
      setIsLoading(true);
      const res = await api.generateVirtualAccount(payment.bill_id, bank);
      setVaData(res);
    } catch (err) {
      console.error('Failed to generate VA:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRIS = async () => {
    if (!payment) return;
    try {
      setIsLoading(true);
      const res = await api.generateQRIS(payment.bill_id);
      setQrisData(res);
    } catch (err) {
      console.error('Failed to generate QRIS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateInstantSettlement = async () => {
    if (!payment) return;
    try {
      setIsSimulating(true);
      const methodName =
        method === 'va'
          ? `Virtual Account ${selectedBank.toUpperCase()}`
          : method === 'qris'
          ? 'QRIS Dinamis (Gopay/BCA/Dana)'
          : 'Transfer Bank Manual';
      await api.simulatePaymentGatewayWebhook(payment.bill_id, methodName, payment.user_id);
      alert('⚡ Pembayaran Terverifikasi Otomatis! Kas Anda langsung berstatus LUNAS.');
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    try {
      setIsLoading(true);
      await api.updatePayment(payment.id, {
        proof_url:
          proofUrl.trim() ||
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        status: 'pending',
      });
      alert('Bukti transfer manual berhasil dikirim untuk verifikasi bendahara.');
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim bukti');
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Iuran Kas Otomatis"
      subtitle={`Tagihan: ${payment.bill_title} • Rp ${payment.amount.toLocaleString('id-ID')}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setMethod('va')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              method === 'va'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Virtual Account</span>
          </button>

          <button
            onClick={() => setMethod('qris')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              method === 'qris'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QRIS Otomatis</span>
          </button>

          <button
            onClick={() => setMethod('manual')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              method === 'manual'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Manual Transfer</span>
          </button>
        </div>

        {/* Tab 1: Virtual Account */}
        {method === 'va' && (
          <div className="space-y-4">
            {/* Bank Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'bca', name: 'BCA Virtual Account', color: 'border-blue-500 bg-blue-50/50' },
                { id: 'mandiri', name: 'Mandiri Livin', color: 'border-amber-500 bg-amber-50/50' },
                { id: 'bri', name: 'BRI BRIVA', color: 'border-blue-600 bg-blue-50/50' },
                { id: 'bni', name: 'BNI Virtual Account', color: 'border-orange-500 bg-orange-50/50' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBank(b.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedBank === b.id
                      ? `${b.color} border-2 font-bold shadow-2xs`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Bank</span>
                  <span className="text-xs font-bold text-slate-900">{b.id.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* VA Number Display */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Menerbitkan nomor Virtual Account...</div>
            ) : vaData ? (
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Nomor Virtual Account {vaData.bank}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Otomatis Terverifikasi
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white/10 p-3 rounded-xl">
                  <span className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-amber-300">
                    {vaData.va_number}
                  </span>
                  <button
                    onClick={() => handleCopy(vaData.va_number)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Total Tagihan:</span>
                  <strong className="text-sm text-white font-mono">
                    Rp {vaData.amount.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            ) : null}

            {/* Payment Instructions */}
            {vaData?.instructions && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 block">Petunjuk Pembayaran ATM / Mobile Banking:</span>
                {vaData.instructions.map((ins: string, idx: number) => (
                  <p key={idx} className="text-slate-600 text-[11px] leading-relaxed">
                    {ins}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: QRIS Otomatis */}
        {method === 'qris' && (
          <div className="space-y-4 text-center">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Menerbitkan QRIS Dinamis...</div>
            ) : (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 inline-block w-full max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>QRIS STANDAR PEMBAYARAN NASIONAL</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  NMID: ID102003928109 • Kas Kelas 01SAKP014 UNPAM
                </p>

                {/* Simulated Visual QR */}
                <div className="p-4 bg-white border-2 border-slate-800 rounded-2xl inline-block shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      qrisData?.qris_string || 'QRIS-01SAKP014'
                    )}`}
                    alt="QRIS Dinamis"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-500">Nominal Iuran:</span>
                  <p className="text-xl font-bold font-mono text-slate-900">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Support GoPay, OVO, ShopeePay, DANA, BCA Mobile, Livin, BRImo
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manual Transfer */}
        {method === 'manual' && (
          <form onSubmit={handleManualUpload} className="space-y-3.5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">Transfer ke Rekening Resmi Kas:</span>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-mono font-bold text-slate-800 text-sm">8801-9283-7482 (Mandiri)</span>
                <span className="text-[11px] text-slate-500">a.n. Kas Kelas 01SAKP014</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Link Struk Bukti Transfer (Google Drive / URL Gambar):
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Kirim Bukti untuk Dicek Bendahara</span>
            </button>
          </form>
        )}

        {/* Instant Webhook Simulator Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-500" />
              <span>Simulasi Settlement Payment Gateway (Auto-Check)</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Uji coba fitur verifikasi instan tanpa perlu bendahara memvalidasi mutasi manual.
            </p>
          </div>

          <button
            onClick={handleSimulateInstantSettlement}
            disabled={isSimulating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Memproses Webhook...' : 'Bayar Instan (Simulasi)'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
