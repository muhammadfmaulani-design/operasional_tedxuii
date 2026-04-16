import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, RefreshCw, TicketPlus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api-tedxuii.vercel.app';

interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

interface ManualTicketPageProps {
  onBack: () => void;
}

const ManualTicketPage = ({ onBack }: ManualTicketPageProps) => {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    whatsapp_no: '',
    category_id: '',
    quantity: 1,
    send_email: false,
  });

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/categories`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Gagal mengambil kategori tiket.');
      }

      const nextCategories = payload.categories || [];
      setCategories(nextCategories);
      setForm((current) => ({
        ...current,
        category_id: current.category_id || nextCategories[0]?.id || '',
      }));
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Gagal mengambil kategori tiket.';
      setError(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.category_id) ?? null,
    [categories, form.category_id],
  );

  const remainingQuota = selectedCategory ? selectedCategory.quota - selectedCategory.sold : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResultMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Gagal membuat tiket manual.');
      }

      setResultMessage(
        `Tiket manual berhasil dibuat. Order ID: ${payload.order_id}. Kursi: ${(payload.seats || []).join(', ') || '-'}`,
      );
      setForm((current) => ({
        ...current,
        full_name: '',
        email: '',
        whatsapp_no: '',
        quantity: 1,
      }));
      void fetchCategories();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Gagal membuat tiket manual.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,70,70,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">Admin Manual Ticket</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Buat tiket tanpa pembayaran</h2>
            <p className="mt-2 text-sm text-white/65">
              Halaman ini membuat order manual baru dengan status langsung `success`, lalu generate tiket otomatis.
            </p>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black">Form tiket manual</h3>
            <p className="text-sm text-white/55">Flow existing tidak diubah. Ini endpoint terpisah khusus admin.</p>
          </div>
          <button
            onClick={() => void fetchCategories()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <RefreshCw size={15} />
            Refresh kategori
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {resultMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {resultMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-white/75">Nama lengkap</span>
            <input
              required
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
              placeholder="Nama peserta"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-white/75">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
              placeholder="email@domain.com"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-white/75">WhatsApp</span>
            <input
              required
              value={form.whatsapp_no}
              onChange={(event) => setForm((current) => ({ ...current, whatsapp_no: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
              placeholder="08xxxxxxxxxx"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-white/75">Kategori tiket</span>
            <select
              required
              disabled={loadingCategories}
              value={form.category_id}
              onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-white/75">Jumlah tiket</span>
            <input
              required
              min={1}
              type="number"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({ ...current, quantity: Number(event.target.value || 1) }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:self-end">
            <input
              type="checkbox"
              checked={form.send_email}
              onChange={(event) => setForm((current) => ({ ...current, send_email: event.target.checked }))}
            />
            <span className="text-sm font-bold text-white/80">Kirim tiket ke email peserta</span>
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Ringkasan kategori</p>
            <div className="mt-3 grid gap-3 text-sm text-white/75 sm:grid-cols-3">
              <p>Kategori: <span className="font-bold text-white">{selectedCategory?.name ?? '-'}</span></p>
              <p>Harga: <span className="font-bold text-white">{selectedCategory?.price ?? 0}</span></p>
              <p>Sisa kuota: <span className="font-bold text-white">{remainingQuota}</span></p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingCategories || !form.category_id}
            className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-4 text-base font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={18} className="animate-spin" /> : <TicketPlus size={18} />}
            {submitting ? 'Membuat tiket...' : 'Buat tiket manual'}
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
          <p className="font-bold text-white/75">Catatan:</p>
          <p className="mt-2">
            Ticket manual ini tidak memakai upload bukti bayar. Order dibuat sebagai `success` dan kursi langsung dikunci.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ManualTicketPage;
