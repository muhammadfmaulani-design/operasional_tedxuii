import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, QrCode, RefreshCw, Search, Ticket, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api-tedxuii.vercel.app';

interface PublicTicket {
  id: string;
  ticket_code: string;
  is_used: boolean;
  ticket_pdf_url?: string | null;
}

interface PublicOrder {
  id: string;
  full_name: string;
  email: string;
  whatsapp_no: string;
  status: string;
  quantity: number;
  total_price: number;
  assigned_seats: string[];
  payment_proof_url?: string | null;
  created_at?: string | null;
  ticket_category?: string | null;
  tickets: PublicTicket[];
}

interface OrderDashboardProps {
  onOpenScanner: () => void;
  onOpenManualTicket: () => void;
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusClassName: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
  pending: 'bg-amber-500/15 text-amber-100 border border-amber-300/30',
  rejected: 'bg-rose-500/15 text-rose-100 border border-rose-300/30',
};

const getScanSummary = (order: PublicOrder) => {
  const scannedCount = order.tickets.filter((ticket) => ticket.is_used).length;
  const totalTickets = order.tickets.length;

  if (totalTickets === 0) {
    return {
      label: 'Belum ada tiket',
      detail: 'Tiket belum digenerate',
      className: 'bg-white/10 text-white border border-white/10',
    };
  }

  if (scannedCount === 0) {
    return {
      label: 'Belum scan',
      detail: `0 / ${totalTickets} tiket`,
      className: 'bg-amber-500/15 text-amber-100 border border-amber-300/30',
    };
  }

  if (scannedCount === totalTickets) {
    return {
      label: 'Sudah scan',
      detail: `${scannedCount} / ${totalTickets} tiket`,
      className: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
    };
  }

  return {
    label: 'Sebagian scan',
    detail: `${scannedCount} / ${totalTickets} tiket`,
    className: 'bg-sky-500/15 text-sky-100 border border-sky-300/30',
  };
};

const OrderDashboard = ({ onOpenScanner, onOpenManualTicket }: OrderDashboardProps) => {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTicketIds, setUpdatingTicketIds] = useState<string[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/public`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Gagal mengambil data order.');
      }

      setOrders(payload.orders || []);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Gagal mengambil data order.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const toggleTicketUsage = async (ticketId: string, nextValue: boolean) => {
    setUpdatingTicketIds((current) => [...current, ticketId]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/tickets/${ticketId}/usage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_used: nextValue }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Gagal memperbarui status scan tiket.');
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) => ({
          ...order,
          tickets: order.tickets.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, is_used: nextValue } : ticket,
          ),
        })),
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : 'Gagal memperbarui status scan tiket.';
      setError(message);
    } finally {
      setUpdatingTicketIds((current) => current.filter((id) => id !== ticketId));
    }
  };

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();

    orders.forEach((order) => {
      if (order.ticket_category?.trim()) {
        categories.add(order.ticket_category.trim());
      }
    });

    return ['Semua', ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const categoryMatched =
        selectedCategory === 'Semua' || (order.ticket_category ?? '').trim() === selectedCategory;

      if (!categoryMatched) return false;

      if (!keyword) return true;

      const haystacks = [
        order.full_name,
        order.email,
        order.whatsapp_no,
        order.status,
        order.ticket_category ?? '',
        order.assigned_seats.join(' '),
        ...order.tickets.map((ticket) => ticket.ticket_code),
      ];

      return haystacks.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [orders, searchTerm, selectedCategory]);

  const totalTickets = useMemo(
    () => orders.reduce((sum, order) => sum + order.quantity, 0),
    [orders],
  );

  return (
    <div className="w-full max-w-7xl space-y-6 text-white">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,70,70,0.22),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              Public Order Board
            </span>
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Daftar order dan tiket TEDxUII</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
                Halaman ini publik di path `/recap`. Di sini tampil daftar pemesan, status pembayaran, kursi, dan kode tiket.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => void fetchOrders()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 font-bold text-white transition hover:bg-white/16"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-500"
            >
              <QrCode size={18} />
              Buka Scanner
            </button>
            <button
              onClick={onOpenManualTicket}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 font-black text-red-50 transition hover:bg-red-500/20"
            >
              <Ticket size={18} />
              Buat Ticket
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total Order</p>
            <div className="mt-3 flex items-center gap-3">
              <Users className="text-red-300" size={22} />
              <p className="text-3xl font-black">{orders.length}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total Tiket</p>
            <div className="mt-3 flex items-center gap-3">
              <Ticket className="text-red-300" size={22} />
              <p className="text-3xl font-black">{totalTickets}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Order Ditampilkan</p>
            <div className="mt-3 flex items-center gap-3">
              <Search className="text-red-300" size={22} />
              <p className="text-3xl font-black">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black">Cari peserta</h3>
            <p className="text-sm text-white/55">Bisa cari nama, email, WhatsApp, kursi, kategori tiket, atau kode tiket.</p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:min-w-[340px]">
            <Search size={18} className="text-white/45" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari data order..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryOptions.map((category) => {
            const isActive = category === selectedCategory;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                    : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <section className="rounded-[2rem] border border-rose-400/30 bg-rose-500/10 p-6 text-rose-50">
          <h3 className="text-lg font-black">Gagal memuat data</h3>
          <p className="mt-2 text-sm text-rose-100/90">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-center text-white/70">
          <RefreshCw size={28} className="mx-auto animate-spin" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em]">Mengambil data order...</p>
        </section>
      ) : null}

      {!loading && !error && filteredOrders.length === 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-center text-white/70">
          <p className="text-lg font-bold">Belum ada order yang cocok dengan pencarian.</p>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(2,6,23,0.96))] shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.22em] text-white/55">
                <tr>
                  <th className="px-4 py-4 font-semibold">Nama</th>
                  <th className="px-4 py-4 font-semibold">Kontak</th>
                  <th className="px-4 py-4 font-semibold">Kategori</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Scan</th>
                  <th className="px-4 py-4 font-semibold">Qty</th>
                  <th className="px-4 py-4 font-semibold">Kursi</th>
                  <th className="px-4 py-4 font-semibold">Kode Tiket</th>
                  <th className="px-4 py-4 font-semibold">Total</th>
                  <th className="px-4 py-4 font-semibold">Dibuat</th>
                  <th className="px-4 py-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  (() => {
                    const scanSummary = getScanSummary(order);

                    return (
                      <tr
                        key={order.id}
                        className={index % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}
                      >
                        <td className="px-4 py-4 align-top">
                      <div className="min-w-[200px]">
                        <p className="font-black tracking-tight text-white">{order.full_name}</p>
                        <p className="mt-1 text-xs text-white/45">{order.id}</p>
                      </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <div className="min-w-[220px] space-y-1">
                        <p className="font-semibold text-white">{order.email}</p>
                        <p className="text-white/65">{order.whatsapp_no}</p>
                      </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <div className="min-w-[150px] font-semibold text-white">
                        {order.ticket_category ?? '-'}
                      </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusClassName[order.status] ?? 'bg-white/10 text-white border border-white/10'}`}>
                        {order.status}
                      </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[145px]">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${scanSummary.className}`}>
                              {scanSummary.label}
                            </span>
                            <p className="mt-2 text-xs text-white/55">{scanSummary.detail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <span className="font-black text-white">{order.quantity}</span>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <div className="flex min-w-[180px] flex-wrap gap-2">
                        {order.assigned_seats.length > 0 ? (
                          order.assigned_seats.map((seat) => (
                            <span
                              key={seat}
                              className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-100"
                            >
                              {seat}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/45">-</span>
                        )}
                      </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <div className="min-w-[220px] space-y-2">
                        {order.tickets.length > 0 ? (
                          order.tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
                              <p className="font-bold text-white">{ticket.ticket_code}</p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                                {ticket.is_used ? 'Sudah digunakan' : 'Belum digunakan'}
                              </p>
                              <button
                                onClick={() => void toggleTicketUsage(ticket.id, !ticket.is_used)}
                                disabled={updatingTicketIds.includes(ticket.id)}
                                className="mt-3 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingTicketIds.includes(ticket.id)
                                  ? 'Memproses...'
                                  : ticket.is_used
                                    ? 'Reset scan'
                                    : 'Tandai scan'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-white/45">Belum ada tiket</span>
                        )}
                      </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <span className="min-w-[140px] font-semibold text-white">
                        {currencyFormatter.format(order.total_price || 0)}
                      </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <span className="min-w-[145px] text-white/75">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="px-4 py-4 align-top">
                      <div className="flex min-w-[150px] flex-col gap-2">
                        {order.payment_proof_url ? (
                          <a
                            href={order.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-bold text-white transition hover:bg-white/10"
                          >
                            <ExternalLink size={15} />
                            Bukti bayar
                          </a>
                        ) : null}
                        {order.tickets[0]?.ticket_pdf_url ? (
                          <a
                            href={order.tickets[0].ticket_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 font-bold text-red-100 transition hover:bg-red-500/15"
                          >
                            <ExternalLink size={15} />
                            Tiket PDF
                          </a>
                        ) : null}
                        {!order.payment_proof_url && !order.tickets[0]?.ticket_pdf_url ? (
                          <span className="text-white/45">-</span>
                        ) : null}
                      </div>
                        </td>
                      </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default OrderDashboard;
